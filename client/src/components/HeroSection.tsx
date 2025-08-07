
import { Search, MapPin, Home, CreditCard, Building2, Warehouse, TreePine, Factory, Hotel, Coins, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { transactionTypes, propertyTypes } from "@/pages/Home/components/FilterTypes";

const cities = [
  { value: "all", label: "ქალაქი" },
  { value: "თბილისი", label: "თბილისი" },
  { value: "ბათუმი", label: "ბათუმი" },
  { value: "ქუთაისი", label: "ქუთაისი" },
  { value: "რუსთავი", label: "რუსთავი" },
  { value: "ზუგდიდი", label: "ზუგდიდი" },
  { value: "თელავი", label: "თელავი" },
  { value: "გორი", label: "გორი" },
  { value: "ბაკურიანი", label: "ბაკურიანი" },
  { value: "ბორჯომი", label: "ბორჯომი" },
  { value: "გუდაური", label: "გუდაური" },
  { value: "ჯავა", label: "ჯავა" },
  { value: "აფხაზეთის ავტონომიური რესპუბლიკა", label: "აფხაზეთის ავტონომიური რესპუბლიკა" },
  { value: "დმანისის რაიონი", label: "დმანისის რაიონი" },
  { value: "ცხინვალის რაიონი", label: "ცხინვალის რაიონი" },
  { value: "სენაკის რაიონი", label: "სენაკის რაიონი" },
  { value: "საჩხერის რაიონი", label: "საჩხერის რაიონი" },
  { value: "ონის რაიონი", label: "ონის რაიონი" },
  { value: "ნინოწმინდის რაიონი", label: "ნინოწმინდის რაიონი" },
  { value: "აბასთუმანი", label: "აბასთუმანი" },
  { value: "აბაშა", label: "აბაშა" },
  { value: "ამბროლაური", label: "ამბროლაური" },
  { value: "აფხაზეთი", label: "აფხაზეთი" },
  { value: "ახალქალაქი", label: "ახალქალაქი" },
  { value: "ახალციხე", label: "ახალციხე" },
  { value: "ახმეტა", label: "ახმეტა" },
  { value: "ბაღდათი", label: "ბაღდათი" },
  { value: "ბოლნისი", label: "ბოლნისი" },
  { value: "გარდაბანი", label: "გარდაბანი" },
  { value: "გურჯაანი", label: "გურჯაანი" },
  { value: "დედოფლისწყარო", label: "დედოფლისწყარო" },
  { value: "დმანისი", label: "დმანისი" },
  { value: "დუშეთი", label: "დუშეთი" },
  { value: "ვანი", label: "ვანი" },
  { value: "ზესტაფონი", label: "ზესტაფონი" },
  { value: "თეთრიწყარო", label: "თეთრიწყარო" },
  { value: "თერჯოლა", label: "თერჯოლა" },
  { value: "კასპი", label: "კასპი" },
  { value: "ლაგოდეხი", label: "ლაგოდეხი" },
  { value: "ლანჩხუთი", label: "ლანჩხუთი" },
  { value: "მანგლისი", label: "მანგლისი" },
  { value: "მარნეული", label: "მარნეული" },
  { value: "მარტვილი", label: "მარტვილი" },
  { value: "მესტია", label: "მესტია" },
  { value: "მცხეთა", label: "მცხეთა" },
  { value: "ნინოწმინდა", label: "ნინოწმინდა" },
  { value: "ოზურგეთი", label: "ოზურგეთი" },
  { value: "ონი", label: "ონი" },
  { value: "საგარეჯო", label: "საგარეჯო" },
  { value: "სამტრედია", label: "სამტრედია" },
  { value: "საჩხერე", label: "საჩხერე" },
  { value: "სენაკი", label: "სენაკი" },
  { value: "სიღნაღი", label: "სიღნაღი" },
  { value: "ტყიბული", label: "ტყიბული" },
  { value: "ფოთი", label: "ფოთი" },
  { value: "ქარელი", label: "ქარელი" },
  { value: "ქობულეთი", label: "ქობულეთი" },
  { value: "ყაზბეგი", label: "ყაზბეგი" },
  { value: "ყვარელი", label: "ყვარელი" },
  { value: "ცაგერი", label: "ცაგერი" },
  { value: "ცხინვალი", label: "ცხინვალი" },
  { value: "წალენჯიხა", label: "წალენჯიხა" },
  { value: "წალკა", label: "წალკა" },
  { value: "წნორი", label: "წნორი" },
  { value: "წყალტუბო", label: "წყალტუბო" },
  { value: "ჭიათურა", label: "ჭიათურა" },
  { value: "ხაშური", label: "ხაშური" },
  { value: "ხევსურეთი", label: "ხევსურეთი" },
  { value: "ხელვაჩაური", label: "ხელვაჩაური" },
  { value: "ხობი", label: "ხობი" },
  { value: "ხონი", label: "ხონი" },
  { value: "ვალე", label: "ვალე" },
  { value: "ხონის მუნიციპალიტეტი", label: "ხონის მუნიციპალიტეტი" },
  { value: "ამბროლაურის მუნიციპალიტეტი", label: "ამბროლაურის მუნიციპალიტეტი" },
  { value: "ხულოს მუნიციპალიტეტი", label: "ხულოს მუნიციპალიტეტი" },
  { value: "ადიგენის მუნიციპალიტეტი", label: "ადიგენის მუნიციპალიტეტი" },
  { value: "ხაშურის მუნიციპალიტეტი", label: "ხაშურის მუნიციპალიტეტი" },
  { value: "ახალციხის მუნიციპალიტეტი", label: "ახალციხის მუნიციპალიტეტი" },
  { value: "ხელვაჩაურის მუნიციპალიტეტი", label: "ხელვაჩაურის მუნიციპალიტეტი" },
  { value: "ხობის მუნიციპალიტეტი", label: "ხობის მუნიციპალიტეტი" },
  { value: "ქუთაისის მუნიციპალიტეტი", label: "ქუთაისის მუნიციპალიტეტი" },
  { value: "ახალგორის მუნიციპალიტეტი", label: "ახალგორის მუნიციპალიტეტი" },
  { value: "მცხეთის მუნიციპალიტეტი", label: "მცხეთის მუნიციპალიტეტი" },
  { value: "ოზურგეთის მუნიციპალიტეტი", label: "ოზურგეთის მუნიციპალიტეტი" },
  { value: "საგარეჯოს მუნიციპალიტეტი", label: "საგარეჯოს მუნიციპალიტეტი" },
  { value: "მესტიის მუნიციპალიტეტი", label: "მესტიის მუნიციპალიტეტი" },
  { value: "სიღნაღის მუნიციპალიტეტი", label: "სიღნაღის მუნიციპალიტეტი" },
  { value: "ახალქალაქის მუნიციპალიტეტი", label: "ახალქალაქის მუნიციპალიტეტი" },
  { value: "მარტვილის მუნიციპალიტეტი", label: "მარტვილის მუნიციპალიტეტი" },
  { value: "ტყიბულის მუნიციპალიტეტი", label: "ტყიბულის მუნიციპალიტეტი" },
  { value: "ქარელის მუნიციპალიტეტი", label: "ქარელის მუნიციპალიტეტი" },
  { value: "ლენტეხის მუნიციპალიტეტი", label: "ლენტეხის მუნიციპალიტეტი" },
  { value: "ლანჩხუთის მუნიციპალიტეტი", label: "ლანჩხუთის მუნიციპალიტეტი" },
  { value: "ლაგოდეხის მუნიციპალიტეტი", label: "ლაგოდეხის მუნიციპალიტეტი" },
  { value: "კასპის მუნიციპალიტეტი", label: "კასპის მუნიციპალიტეტი" },
  { value: "ქობულეთის მუნიციპალიტეტი", label: "ქობულეთის მუნიციპალიტეტი" },
  { value: "ყაზბეგის მუნიციპალიტეტი", label: "ყაზბეგის მუნიციპალიტეტი" },
  { value: "თერჯოლის მუნიციპალიტეტი", label: "თერჯოლის მუნიციპალიტეტი" },
  { value: "ყვარლის მუნიციპალიტეტი", label: "ყვარლის მუნიციპალიტეტი" },
  { value: "თეთრიწყაროს მუნიციპალიტეტი", label: "თეთრიწყაროს მუნიციპალიტეტი" },
  { value: "თელავის მუნიციპალიტეტი", label: "თელავის მუნიციპალიტეტი" },
  { value: "შუახევის მუნიციპალიტეტი", label: "შუახევის მუნიციპალიტეტი" },
  { value: "ჩოხატაურის მუნიციპალიტეტი", label: "ჩოხატაურის მუნიციპალიტეტი" },
  { value: "ზუგდიდის მუნიციპალიტეტი", label: "ზუგდიდის მუნიციპალიტეტი" },
  { value: "ზესტაფონის მუნიციპალიტეტი", label: "ზესტაფონის მუნიციპალიტეტი" },
  { value: "ვანის მუნიციპალიტეტი", label: "ვანის მუნიციპალიტეტი" },
  { value: "ახმეტის მუნიციპალიტეტი", label: "ახმეტის მუნიციპალიტეტი" },
  { value: "ბაღდათის მუნიციპალიტეტი", label: "ბაღდათის მუნიციპალიტეტი" },
  { value: "ბოლნისის მუნიციპალიტეტი", label: "ბოლნისის მუნიციპალიტეტი" },
  { value: "ბორჯომის მუნიციპალიტეტი", label: "ბორჯომის მუნიციპალიტეტი" },
  { value: "ხარაგაულის მუნიციპალიტეტი", label: "ხარაგაულის მუნიციპალიტეტი" },
  { value: "გარდაბნის მუნიციპალიტეტი", label: "გარდაბნის მუნიციპალიტეტი" },
  { value: "გორის მუნიციპალიტეტი", label: "გორის მუნიციპალიტეტი" },
  { value: "წალკის მუნიციპალიტეტი", label: "წალკის მუნიციპალიტეტი" },
  { value: "გურჯაანის მუნიციპალიტეტი", label: "გურჯაანის მუნიციპალიტეტი" },
  { value: "წალენჯიხის მუნიციპალიტეტი", label: "წალენჯიხის მუნიციპალიტეტი" },
  { value: "დედოფლისწყაროს მუნიციპალიტეტი", label: "დედოფლისწყაროს მუნიციპალიტეტი" },
  { value: "დუშეთის მუნიციპალიტეტი", label: "დუშეთის მუნიციპალიტეტი" },
  { value: "ასპინძის მუნიციპალიტეტი", label: "ასპინძის მუნიციპალიტეტი" },
  { value: "ცაგერის მუნიციპალიტეტი", label: "ცაგერის მუნიციპალიტეტი" },
  { value: "აბაშის მუნიციპალიტეტი", label: "აბაშის მუნიციპალიტეტი" },
  { value: "ჩხოროწყუს მუნიციპალიტეტი", label: "ჩხოროწყუს მუნიციპალიტეტი" },
  { value: "წყალტუბოს მუნიციპალიტეტი", label: "წყალტუბოს მუნიციპალიტეტი" },
  { value: "სამტრედიის მუნიციპალიტეტი", label: "სამტრედიის მუნიციპალიტეტი" },
  { value: "მარნეულის მუნიციპალიტეტი", label: "მარნეულის მუნიციპალიტეტი" },
  { value: "ქედის მუნიციპალიტეტი", label: "ქედის მუნიციპალიტეტი" },
  { value: "თიანეთის მუნიციპალიტეტი", label: "თიანეთის მუნიციპალიტეტი" }
];

interface HeroSearchFilters {
  search: string;
  transactionType: string;
  propertyType: string;
  city: string;
}

interface HeroSectionProps {
  onSearch: (filters: HeroSearchFilters) => void;
}

export const HeroSection = ({ onSearch }: HeroSectionProps) => {
  const [filters, setFilters] = useState<HeroSearchFilters>({
    search: "",
    transactionType: "all",
    propertyType: "all",
    city: "all"
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center container mx-auto">
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
            იპოვე შენი <span className="text-primary">სახლი</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            საუკეთესო უძრავი ქონების შეთავაზებები თბილისში და მთელ საქართველოში
          </p>
          
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 mx-auto">
            <div className="flex gap-6">
              {/* Transaction Type */}
              <div className="w-2/12 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <label className="text-sm font-semibold text-slate-700">
                    გარიგების ტიპი
                  </label>
                </div>
                <Select 
                  value={filters.transactionType} 
                  onValueChange={(value) => setFilters({...filters, transactionType: value})}
                >
                  <SelectTrigger className="h-14 text-sm border-2 border-slate-200 hover:border-primary/50 focus:border-primary rounded-xl transition-colors">
                    <SelectValue placeholder="აირჩიეთ ტიპი" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {transactionTypes.map((type) => {
                      const getIcon = (value: string) => {
                        switch(value) {
                          case 'იყიდება': return <Coins className="h-4 w-4 text-primary" />;
                          case 'ქირავდება': return <Home className="h-4 w-4 text-primary" />;
                          case 'გირავდება': return <CreditCard className="h-4 w-4 text-primary" />;
                          case 'გაიცემა იჯარით': return <Building2 className="h-4 w-4 text-primary" />;
                          case 'ქირავდება დღიურად': return <Hotel className="h-4 w-4 text-primary" />;
                          default: return <CreditCard className="h-4 w-4 text-primary" />;
                        }
                      };
                      return (
                        <SelectItem key={type.value} value={type.value} className="text-base py-3">
                          <div className="flex items-center gap-3">
                            {getIcon(type.value)}
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Property Type */}
              <div className="w-2/12 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  <label className="text-sm font-semibold text-slate-700">
                    ქონების ტიპი
                  </label>
                </div>
                <Select 
                  value={filters.propertyType} 
                  onValueChange={(value) => setFilters({...filters, propertyType: value})}
                >
                  <SelectTrigger className="h-14 text-sm border-2 border-slate-200 hover:border-primary/50 focus:border-primary rounded-xl transition-colors">
                    <SelectValue placeholder="აირჩიეთ ტიპი" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {propertyTypes.map((type) => {
                      const getIcon = (value: string) => {
                        switch(value) {
                          case 'ბინები': return <Building2 className="h-4 w-4 text-primary" />;
                          case 'სახლები': return <Home className="h-4 w-4 text-primary" />;
                          case 'აგარაკები': return <TreePine className="h-4 w-4 text-primary" />;
                          case 'მიწის ნაკვეთები': return <MapPin className="h-4 w-4 text-primary" />;
                          case 'კომერციული ფართები': return <Factory className="h-4 w-4 text-primary" />;
                          case 'სასტუმროები': return <Hotel className="h-4 w-4 text-primary" />;
                          default: return <Home className="h-4 w-4 text-primary" />;
                        }
                      };
                      return (
                        <SelectItem key={type.value} value={type.value} className="text-base py-3">
                          <div className="flex items-center gap-3">
                            {getIcon(type.value)}
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input with Integrated City Selection - Now takes 2 columns */}
              <div className="w-5/12 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <label className="text-sm font-semibold text-slate-700">
                    მისამართი
                  </label>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="შეიყვანეთ მისამართი, რაიონი..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    onKeyPress={handleKeyPress}
                    className="h-14 text-base border-2 border-slate-200 hover:border-primary/50 focus:border-primary rounded-xl pl-11 pr-32 transition-colors"
                  />

                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <Select 
                      value={filters.city} 
                      onValueChange={(value) => setFilters({...filters, city: value})}
                    >
                      <SelectTrigger className="h-10 w-48 text-sm border border-slate-300 hover:border-primary/50 focus:border-primary rounded-lg transition-colors bg-white/90 backdrop-blur-sm">
                        <SelectValue placeholder="ქალაქი" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl max-h-60 w-64">
                        {cities.map((city) => (
                          <SelectItem key={city.value} value={city.value} className="text-sm py-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3 text-primary" />
                              <span>{city.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Search and Clear Buttons */}
              <div className="w-3/12 flex flex-col justify-end">
                {/* Check if any filter is selected */}
                {(filters.search !== "" || filters.transactionType !== "all" || filters.propertyType !== "all" || filters.city !== "all") ? (
                  <div className="grid grid-cols-10 gap-2">
                    <Button 
                      onClick={handleSearch}
                      size="lg" 
                      className="group h-14 col-span-7 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-base"
                    >
                      <Search className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                      ძიება
                    </Button>
                    
                    <Button 
                      onClick={() => setFilters({
                        search: "",
                        transactionType: "all",
                        propertyType: "all",
                        city: "all"
                      })}
                      variant="outline" 
                      size="lg"
                      className="h-14 col-span-3 flex items-center justify-center border border-slate-300 hover:bg-slate-100 rounded-xl transition-all duration-300"
                      aria-label="გასუფთავება"
                    >
                      <X className="h-6 w-6 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleSearch}
                    size="lg" 
                    className="group h-14 w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-base"
                  >
                    <Search className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    ძიება
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-600 mb-4">პოპულარული ძებნები:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['ვაკე', 'საბურთალო', 'ისანი', 'გლდანი', 'ძველი თბილისი', 'მთაწმინდა'].map((location) => (
                <button
                  key={location}
                  onClick={() => setFilters({...filters, search: location})}
                  className="px-4 py-2 bg-white/80 hover:bg-primary/10 border border-slate-200 hover:border-primary/30 rounded-full text-sm text-slate-700 hover:text-primary transition-all duration-200 backdrop-blur-sm"
                >
                  <MapPin className="inline h-3 w-3 mr-1" />
                  {location}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
