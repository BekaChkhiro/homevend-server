
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

interface CurrencyConverterProps {
  className?: string;
}

export const CurrencyConverter = ({ className }: CurrencyConverterProps) => {
  const [gelAmount, setGelAmount] = useState<string>("1000");
  const [usdAmount, setUsdAmount] = useState<string>("370");
  const [exchangeRate] = useState(2.7); // Fixed rate for demo

  const convertGelToUsd = () => {
    const gel = parseFloat(gelAmount) || 0;
    const usd = gel / exchangeRate;
    setUsdAmount(usd.toFixed(2));
  };

  const convertUsdToGel = () => {
    const usd = parseFloat(usdAmount) || 0;
    const gel = usd * exchangeRate;
    setGelAmount(gel.toFixed(2));
  };

  useEffect(() => {
    convertGelToUsd();
  }, [gelAmount]);

  useEffect(() => {
    convertUsdToGel();
  }, [usdAmount]);

  const handleGelChange = (value: string) => {
    setGelAmount(value);
  };

  const handleUsdChange = (value: string) => {
    setUsdAmount(value);
  };

  const swapCurrencies = () => {
    const tempGel = gelAmount;
    const tempUsd = usdAmount;
    setGelAmount(tempUsd);
    setUsdAmount(tempGel);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">ვალუტის გადამთვლელი</CardTitle>
        <p className="text-sm text-muted-foreground">
          კურსი: 1 USD = {exchangeRate} ლარი
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gel">ლარი (GEL)</Label>
          <Input
            id="gel"
            type="number"
            value={gelAmount}
            onChange={(e) => handleGelChange(e.target.value)}
            placeholder="0.00"
            className="w-full"
          />
        </div>
        
        <div className="flex justify-center my-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={swapCurrencies}
            className="h-8 w-8"
            aria-label="გადაცვლა"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="usd">დოლარი (USD)</Label>
          <Input
            id="usd"
            type="number"
            value={usdAmount}
            onChange={(e) => handleUsdChange(e.target.value)}
            placeholder="0.00"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};
