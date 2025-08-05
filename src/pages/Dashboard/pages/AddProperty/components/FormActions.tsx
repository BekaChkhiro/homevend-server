import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Send, Loader2, Clock, CheckCircle } from "lucide-react";

interface FormActionsProps {
  onSaveDraft: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
  isDraftSaving?: boolean;
}

export const FormActions: React.FC<FormActionsProps> = ({
  onSaveDraft,
  onSubmit,
  isLoading = false,
  isDraftSaving = false,
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 shadow-lg z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Draft info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              {isDraftSaving ? (
                <>
                  <div className="flex items-center justify-center w-5 h-5">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                  <span className="text-blue-700 font-medium">დრაფთი ინახება...</span>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center w-5 h-5 bg-green-100 rounded-full">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-muted-foreground">ავტომატური შენახვა ჩართულია</span>
                </>
              )}
            </div>
            
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>ბოლო შენახვა: 2 წუთის წინ</span>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={isDraftSaving || isLoading}
              className="hidden sm:flex items-center gap-2 h-11 px-6 border-border/50 hover:border-primary/30 hover:bg-accent transition-all"
            >
              {isDraftSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="font-medium">დრაფთად შენახვა</span>
            </Button>

            <Button
              type="submit"
              onClick={onSubmit}
              disabled={isLoading || isDraftSaving}
              className="flex items-center gap-2 h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all duration-200 min-w-[180px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>იგზავნება...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>განცხადების დამატება</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Draft Button */}
        <div className="sm:hidden mt-3 pt-3 border-t border-border/30">
          <Button
            type="button"
            variant="ghost"
            onClick={onSaveDraft}
            disabled={isDraftSaving || isLoading}
            className="w-full flex items-center gap-2 h-10 text-muted-foreground hover:text-foreground"
          >
            {isDraftSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>დრაფთად შენახვა</span>
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="mt-3 hidden lg:block">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>შევსების პროგრესი</span>
            <span>65% დასრულებული</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: '65%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};