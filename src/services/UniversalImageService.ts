import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/database.js';
import { Image, EntityType, ImageUrls } from '../models/Image.js';
import { User } from '../models/User.js';

interface ImageConfig {
  maxFiles: number;
  maxSize: number; // in MB
  sizes: Array<{
    name: string;
    width: number;
    height: number;
    quality?: number;
    watermark?: boolean;
  }>;
  acceptedTypes: string[];
  requireSquare?: boolean;
  preserveTransparency?: boolean;
}

export class UniversalImageService {
  private s3Client: S3Client;
  private bucket: string;
  private s3PublicUrl: string;
  private imageRepo = AppDataSource.getRepository(Image);
  private configs: Map<string, ImageConfig>;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET!;
    this.s3PublicUrl = process.env.AWS_S3_PUBLIC_URL!;
    this.configs = this.loadImageConfigs();
  }

  /**
   * Upload image for any entity
   */
  async uploadImage(params: {
    entityType: EntityType;
    entityId: number;
    purpose: string;
    file: Express.Multer.File;
    userId: number;
    altText?: string;
    caption?: string;
    tags?: string[];
    isPrimary?: boolean;
    expiresIn?: number; // hours
  }): Promise<Image> {
    const config = this.getConfig(params.purpose);
    
    // Validate file
    this.validateFile(params.file, config);

    // Check existing image count
    const existingCount = await this.imageRepo.count({
      where: {
        entityType: params.entityType,
        entityId: params.entityId,
        purpose: params.purpose,
      },
    });

    if (existingCount >= config.maxFiles) {
      throw new Error(`Maximum ${config.maxFiles} images allowed for ${params.purpose}`);
    }

    // Generate unique identifier
    const imageId = uuidv4();
    const extension = this.getExtension(params.file.originalname);
    const baseKey = `${params.entityType}/${params.entityId}/${params.purpose}`;

    // Process and upload image sizes
    const urls: ImageUrls = { original: '' };
    const metadata = await sharp(params.file.buffer).metadata();

    // Validate dimensions if required
    if (config.requireSquare && metadata.width !== metadata.height) {
      throw new Error('Square image required');
    }

    // Upload original
    const originalKey = `${baseKey}/original/${imageId}.${extension}`;
    await this.uploadToS3(originalKey, params.file.buffer, params.file.mimetype);
    urls.original = this.getPublicUrl(originalKey);

    // Process and upload different sizes
    for (const size of config.sizes) {
      const processed = await this.processImage(
        params.file.buffer,
        size,
        config.preserveTransparency
      );
      
      const sizeKey = `${baseKey}/${size.name}/${imageId}.${
        config.preserveTransparency ? 'png' : 'jpg'
      }`;
      
      await this.uploadToS3(
        sizeKey,
        processed,
        config.preserveTransparency ? 'image/png' : 'image/jpeg'
      );
      
      urls[size.name] = this.getPublicUrl(sizeKey);
    }

    // Handle primary image logic
    if (params.isPrimary || existingCount === 0) {
      // Remove existing primary
      await this.imageRepo.update(
        {
          entityType: params.entityType,
          entityId: params.entityId,
          purpose: params.purpose,
          isPrimary: true,
        },
        { isPrimary: false }
      );
    }

    // Get sort order
    const maxOrder = await this.imageRepo
      .createQueryBuilder('image')
      .where('image.entityType = :entityType', { entityType: params.entityType })
      .andWhere('image.entityId = :entityId', { entityId: params.entityId })
      .andWhere('image.purpose = :purpose', { purpose: params.purpose })
      .select('MAX(image.sortOrder)', 'max')
      .getRawOne();

    // Create database record
    const image = this.imageRepo.create({
      entityType: params.entityType,
      entityId: params.entityId,
      purpose: params.purpose,
      fileName: `${imageId}.${extension}`,
      originalName: params.file.originalname,
      s3Key: originalKey,
      urls,
      metadata: {
        width: metadata.width!,
        height: metadata.height!,
        format: metadata.format!,
        space: metadata.space,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
      },
      mimeType: params.file.mimetype,
      fileSize: params.file.size,
      altText: params.altText,
      caption: params.caption,
      tags: params.tags || [],
      isPrimary: params.isPrimary || existingCount === 0,
      sortOrder: (maxOrder?.max || 0) + 1,
      uploadedById: params.userId,
      expiresAt: params.expiresIn
        ? new Date(Date.now() + params.expiresIn * 60 * 60 * 1000)
        : undefined,
    });

    return await this.imageRepo.save(image);
  }

  /**
   * Upload multiple images
   */
  async uploadMultiple(params: {
    entityType: EntityType;
    entityId: number;
    purpose: string;
    files: Express.Multer.File[];
    userId: number;
  }): Promise<Image[]> {
    console.log(`🚀 uploadMultiple called: ${params.files.length} files for ${params.entityType} ${params.entityId}`);
    
    const uploadPromises = params.files.map((file, index) => {
      console.log(`📁 Processing file ${index + 1}: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
      return this.uploadImage({
        entityType: params.entityType,
        entityId: params.entityId,
        purpose: params.purpose,
        file,
        userId: params.userId,
        isPrimary: index === 0,
      });
    });

    const results = await Promise.all(uploadPromises);
    console.log(`✅ uploadMultiple completed: ${results.length} images processed`);
    return results;
  }

  /**
   * Get images for entity
   */
  async getEntityImages(
    entityType: EntityType,
    entityId: number,
    purpose?: string
  ): Promise<Image[]> {
    const query = this.imageRepo
      .createQueryBuilder('image')
      .where('image.entityType = :entityType', { entityType })
      .andWhere('image.entityId = :entityId', { entityId });

    if (purpose) {
      query.andWhere('image.purpose = :purpose', { purpose });
    }

    return await query
      .orderBy('image.isPrimary', 'DESC')
      .addOrderBy('image.sortOrder', 'ASC')
      .getMany();
  }

  /**
   * Delete image
   */
  async deleteImage(imageId: number, userId: number, userRole?: string): Promise<void> {
    const image = await this.imageRepo.findOne({
      where: { id: imageId },
      relations: ['uploadedBy'],
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Check permission
    if (!this.canDeleteImage(image, userId, userRole)) {
      throw new Error('Unauthorized to delete this image');
    }

    // Delete from S3
    await this.deleteFromS3(image);

    // Delete from database
    await this.imageRepo.remove(image);

    // If was primary, set next image as primary
    if (image.isPrimary) {
      const nextImage = await this.imageRepo.findOne({
        where: {
          entityType: image.entityType,
          entityId: image.entityId,
          purpose: image.purpose,
        },
        order: { sortOrder: 'ASC' },
      });

      if (nextImage) {
        nextImage.isPrimary = true;
        await this.imageRepo.save(nextImage);
      }
    }
  }

  /**
   * Reorder images
   */
  async reorderImages(
    entityType: EntityType,
    entityId: number,
    purpose: string,
    imageOrders: Array<{ imageId: number; sortOrder: number }>
  ): Promise<void> {
    for (const order of imageOrders) {
      await this.imageRepo.update(
        {
          id: order.imageId,
          entityType,
          entityId,
          purpose,
        },
        { sortOrder: order.sortOrder }
      );
    }
  }

  /**
   * Set primary image
   */
  async setPrimaryImage(imageId: number): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId } });
    
    if (!image) {
      throw new Error('Image not found');
    }

    // Remove current primary
    await this.imageRepo.update(
      {
        entityType: image.entityType,
        entityId: image.entityId,
        purpose: image.purpose,
        isPrimary: true,
      },
      { isPrimary: false }
    );

    // Set new primary
    image.isPrimary = true;
    await this.imageRepo.save(image);
  }

  /**
   * Generate pre-signed upload URL
   */
  async getPresignedUploadUrl(params: {
    entityType: EntityType;
    entityId: number;
    purpose: string;
    fileName: string;
    contentType: string;
  }): Promise<{ uploadUrl: string; key: string }> {
    const imageId = uuidv4();
    const extension = this.getExtension(params.fileName);
    const key = `${params.entityType}/${params.entityId}/${params.purpose}/original/${imageId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.contentType,
      ACL: 'public-read',
      Metadata: {
        entityType: params.entityType,
        entityId: params.entityId.toString(),
        purpose: params.purpose,
      },
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    return { uploadUrl, key };
  }

  // Private helper methods

  private loadImageConfigs(): Map<string, ImageConfig> {
    return new Map([
      ['user_avatar', {
        maxFiles: 1,
        maxSize: 5,
        sizes: [
          { name: 'thumbnail', width: 50, height: 50, quality: 80 },
          { name: 'small', width: 150, height: 150, quality: 85 },
          { name: 'medium', width: 300, height: 300, quality: 90 },
        ],
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        requireSquare: true,
      }],
      ['property_gallery', {
        maxFiles: 15,
        maxSize: 15,
        sizes: [
          { name: 'thumbnail', width: 300, height: 200, quality: 80 },
          { name: 'medium', width: 800, height: 600, quality: 85 },
          { name: 'large', width: 1920, height: 1080, quality: 90 },
        ],
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }],
      ['agency_logo', {
        maxFiles: 1,
        maxSize: 2,
        sizes: [
          { name: 'small', width: 100, height: 100, quality: 90 },
          { name: 'medium', width: 200, height: 200, quality: 90 },
        ],
        acceptedTypes: ['image/jpeg', 'image/png', 'image/svg+xml'],
        preserveTransparency: true,
      }],
      ['project_gallery', {
        maxFiles: 20,
        maxSize: 10,
        sizes: [
          { name: 'thumbnail', width: 300, height: 200, quality: 80 },
          { name: 'medium', width: 800, height: 600, quality: 85 },
          { name: 'large', width: 1200, height: 900, quality: 90 },
        ],
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }],
    ]);
  }

  private getConfig(purpose: string): ImageConfig {
    const config = this.configs.get(purpose);
    if (!config) {
      // Return default config
      return {
        maxFiles: 10,
        maxSize: 10,
        sizes: [
          { name: 'thumbnail', width: 200, height: 200 },
          { name: 'medium', width: 800, height: 600 },
        ],
        acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      };
    }
    return config;
  }

  private validateFile(file: Express.Multer.File, config: ImageConfig): void {
    const maxSizeBytes = config.maxSize * 1024 * 1024;
    
    if (file.size > maxSizeBytes) {
      throw new Error(`File size exceeds ${config.maxSize}MB limit`);
    }

    if (!config.acceptedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} not accepted`);
    }
  }

  private async processImage(
    buffer: Buffer,
    size: any,
    preserveTransparency: boolean = false
  ): Promise<Buffer> {
    let pipeline = sharp(buffer)
      .resize(size.width, size.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });

    if (size.watermark) {
      // Add watermark logic here if needed
    }

    if (preserveTransparency) {
      return pipeline.png({ quality: size.quality || 90 }).toBuffer();
    } else {
      return pipeline.jpeg({ quality: size.quality || 85 }).toBuffer();
    }
  }

  private async uploadToS3(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<void> {
    console.log(`📤 Uploading to S3: ${key} (${buffer.length} bytes, ${contentType})`);
    console.log(`🪣 Bucket: ${this.bucket}`);
    console.log(`🌐 Region: ${process.env.AWS_REGION}`);
    
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read',
          CacheControl: 'max-age=31536000',
        })
      );
      console.log(`✅ Successfully uploaded: ${key}`);
      console.log(`🔗 Public URL: ${this.getPublicUrl(key)}`);
    } catch (error) {
      console.error(`❌ S3 Upload failed for ${key}:`, error);
      throw error;
    }
  }

  private async deleteFromS3(image: Image): Promise<void> {
    const keys = this.getS3KeysFromImage(image);
    
    if (keys.length > 0) {
      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
          },
        })
      );
    }
  }

  private getS3KeysFromImage(image: Image): string[] {
    return Object.values(image.urls)
      .filter(Boolean)
      .map((url) => this.getS3KeyFromUrl(url as string));
  }

  private getS3KeyFromUrl(url: string): string {
    return url.replace(`${this.s3PublicUrl}/`, '');
  }

  private getPublicUrl(key: string): string {
    return `${this.s3PublicUrl}/${key}`;
  }

  private getExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  private canDeleteImage(image: Image, userId: number, userRole?: string): boolean {
    // Admins can delete any image
    if (userRole === 'admin') {
      return true;
    }
    // Regular users can only delete their own images
    return image.uploadedById === userId;
  }
}

export default new UniversalImageService();