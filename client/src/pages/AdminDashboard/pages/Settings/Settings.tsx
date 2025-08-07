import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Users, Home } from 'lucide-react';

const Settings = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">სისტემის პარამეტრები</h1>
        <p className="text-gray-600">პლატფორმის კონფიგურაცია და პარამეტრები</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>კონფიგურაცია</CardTitle>
          <CardDescription>სისტემის ძირითადი პარამეტრების კონფიგურაცია</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              <SettingsIcon className="h-4 w-4 mr-2" />
              ზოგადი პარამეტრები
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="h-4 w-4 mr-2" />
              მომხმარებლების პარამეტრები
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Home className="h-4 w-4 mr-2" />
              განცხადებების პარამეტრები
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;