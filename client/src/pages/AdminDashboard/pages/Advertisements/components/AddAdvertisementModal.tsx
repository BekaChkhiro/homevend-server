import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Upload, X, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ka } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AdPlacement {
  id: string;
  name: string;
  location: string;
  type: 'banner' | 'sidebar' | 'popup' | 'footer';
  dimensions: string;
  status: 'active' | 'inactive';
  price: number;
}

interface AddAdvertisementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adData: any) => void;
  availablePlacements: AdPlacement[];
  selectedPlacementId?: string;
}

interface FormData {
  title: string;
  description: string;
  advertiser: string;
  placementId: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  imageUrl: string;
  targetUrl: string;
}

export const AddAdvertisementModal = ({
  isOpen,
  onClose,
  onSubmit,
  availablePlacements,
  selectedPlacementId
}: AddAdvertisementModalProps) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    advertiser: '',
    placementId: selectedPlacementId || '',
    startDate: undefined,
    endDate: undefined,
    imageUrl: '',
    targetUrl: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPlacement = availablePlacements.find(p => p.id === formData.placementId);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'რეკლამის სათაური აუცილებელია';
    if (!formData.advertiser.trim()) newErrors.advertiser = 'რეკლამის ავტორის სახელი აუცილებელია';
    if (!formData.placementId) newErrors.placementId = 'რეკლამის ადგილის არჩევა აუცილებელია';
    if (!formData.startDate) newErrors.startDate = 'დაწყების თარიღი აუცილებელია';
    if (!formData.endDate) newErrors.endDate = 'დასრულების თარიღი აუცილებელია';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = 'რეკლამის სურათი აუცილებელია';
    if (!formData.targetUrl.trim()) newErrors.targetUrl = 'მიზნობრივი ლინკი აუცილებელია';
    
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      newErrors.endDate = 'დასრულების თარიღი უნდა იყოს დაწყების თარიღზე გვიან';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const adData = {
        ...formData,
        createdAt: new Date(),
        status: 'pending' as const
      };
      
      await onSubmit(adData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        advertiser: '',
        placementId: '',
        startDate: undefined,
        endDate: undefined,
        imageUrl: '',
        targetUrl: ''
      });
      onClose();
    } catch (error) {
      console.error('Error submitting ad:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      advertiser: '',
      placementId: selectedPlacementId || '',
      startDate: undefined,
      endDate: undefined,
      imageUrl: '',
      targetUrl: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">ახალი რეკლამის დამატება</DialogTitle>
          <DialogDescription>
            შეიყვანეთ რეკლამის დეტალები და აირჩიეთ სადე განთავსება
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">რეკლამის სათაური *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="მაგ: ახალი პროექტი - ვაკის რეზიდენცია"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="advertiser">რეკლამის ავტორი *</Label>
              <Input
                id="advertiser"
                value={formData.advertiser}
                onChange={(e) => handleInputChange('advertiser', e.target.value)}
                placeholder="მაგ: ვაკე დეველოპმენტი"
                className={errors.advertiser ? 'border-red-500' : ''}
              />
              {errors.advertiser && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.advertiser}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">აღწერა</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="რეკლამის დეტალური აღწერა..."
              rows={3}
            />
          </div>

          {/* Placement Selection */}
          <div className="space-y-2">
            <Label>რეკლამის ადგილი *</Label>
            <Select
              value={formData.placementId}
              onValueChange={(value) => handleInputChange('placementId', value)}
            >
              <SelectTrigger className={errors.placementId ? 'border-red-500' : ''}>
                <SelectValue placeholder="აირჩიეთ რეკლამის ადგილი" />
              </SelectTrigger>
              <SelectContent>
                {availablePlacements.map((placement) => (
                  <SelectItem key={placement.id} value={placement.id}>
                    <div className="flex items-center w-full">
                      <span className="font-medium">{placement.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({placement.dimensions})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.placementId && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.placementId}
              </p>
            )}
            {selectedPlacement && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>არჩეული ადგილი:</strong> {selectedPlacement.location}
                </p>
                <p className="text-sm text-blue-600">
                  ზომა: {selectedPlacement.dimensions}
                </p>
              </div>
            )}
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>დაწყების თარიღი *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startDate && "text-muted-foreground",
                      errors.startDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "dd MMMM yyyy", { locale: ka }) : "აირჩიეთ თარიღი"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => handleInputChange('startDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.startDate && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.startDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>დასრულების თარიღი *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.endDate && "text-muted-foreground",
                      errors.endDate && "border-red-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "dd MMMM yyyy", { locale: ka }) : "აირჩიეთ თარიღი"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => handleInputChange('endDate', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.endDate && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>

          {/* Media and Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">რეკლამის სურათის URL *</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={errors.imageUrl ? 'border-red-500' : ''}
                />
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              {errors.imageUrl && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.imageUrl}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUrl">მიზნობრივი ლინკი *</Label>
              <Input
                id="targetUrl"
                value={formData.targetUrl}
                onChange={(e) => handleInputChange('targetUrl', e.target.value)}
                placeholder="https://example.com"
                className={errors.targetUrl ? 'border-red-500' : ''}
              />
              {errors.targetUrl && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.targetUrl}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            გაუქმება
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'ემატება...' : 'რეკლამის დამატება'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};