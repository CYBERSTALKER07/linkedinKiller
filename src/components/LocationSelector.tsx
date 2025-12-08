import React, { useState, useEffect } from 'react';
import { Country, City } from 'country-state-city';
import { MapPin, Building2, Home } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/cva';

interface LocationData {
    country: string;
    city: string;
    street_address: string;
}

interface LocationSelectorProps {
    value: LocationData;
    onChange: (value: LocationData) => void;
    error?: string;
}

export default function LocationSelector({ value, onChange, error }: LocationSelectorProps) {
    const { isDark } = useTheme();
    const [countries, setCountries] = useState<any[]>([]);
    const [cities, setCities] = useState<any[]>([]);

    // We need to store the ISO code to fetch cities, but user wants to save "Country Name"
    // So we might need to store both or find country by name.
    // Best practice: Store ISO code for logic, Name for display/DB if simple string required.
    // But usually DB stores ISO code.
    // Given existing `location` string column, user likely expects readable text.
    // I will store Name in the value object, but manage ISO code internally or use Name to find ISO.

    // Actually, finding ISO from Name is slow if we only have Name.
    // Let's rely on finding by name or better: Update the local state to track ISO code if possible.
    // But the parent only gets `LocationData`.
    // Let's try to map names to codes.

    const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');

    useEffect(() => {
        setCountries(Country.getAllCountries());
    }, []);

    useEffect(() => {
        if (value.country) {
            const country = countries.find(c => c.name === value.country);
            if (country) {
                setSelectedCountryCode(country.isoCode);
                setCities(City.getCitiesOfCountry(country.isoCode) || []);
            }
        } else {
            setSelectedCountryCode('');
            setCities([]);
        }
    }, [value.country, countries]);

    const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const isoCode = e.target.value;
        const country = countries.find(c => c.isoCode === isoCode);

        onChange({
            ...value,
            country: country ? country.name : '',
            city: '', // Reset city when country changes
        });
    };

    const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange({
            ...value,
            city: e.target.value
        });
    };

    const handleStreetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({
            ...value,
            street_address: e.target.value
        });
    };

    const inputClasses = cn(
        "w-full border rounded-3xl px-4 py-2.5 outline-none focus:border-2 transition-all",
        isDark
            ? 'bg-zinc-900/50 border-gray-200/10 text-white focus:border-lime-400'
            : 'bg-white border-gray-200 text-gray-900 focus:border-lime-500 shadow-sm'
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Country */}
                <div className="space-y-2">
                    <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                        <Building2 className="h-4 w-4" />
                        <span>Country *</span>
                    </label>
                    <div className="relative">
                        <select
                            value={selectedCountryCode}
                            onChange={handleCountryChange}
                            className={cn(inputClasses, "appearance-none")}
                        >
                            <option value="">Select Country</option>
                            {countries.map((country) => (
                                <option key={country.isoCode} value={country.isoCode}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className={cn("w-4 h-4", isDark ? "text-gray-400" : "text-gray-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* City */}
                <div className="space-y-2">
                    <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                        <MapPin className="h-4 w-4" />
                        <span>City *</span>
                    </label>
                    <div className="relative">
                        <select
                            value={value.city}
                            onChange={handleCityChange}
                            disabled={!selectedCountryCode}
                            className={cn(inputClasses, "appearance-none", !selectedCountryCode && "opacity-50 cursor-not-allowed")}
                        >
                            <option value="">Select City</option>
                            {cities.map((city, index) => (
                                // Using index as key because some cities might have same name/code? City.name is unique per country usually.
                                // Re-verify keys. City object has name.
                                <option key={`${city.name}-${index}`} value={city.name}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className={cn("w-4 h-4", isDark ? "text-gray-400" : "text-gray-500")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Street Address */}
            <div className="space-y-2">
                <label className={cn("font-semibold flex items-center space-x-2", isDark ? 'text-white' : 'text-black')}>
                    <Home className="h-4 w-4" />
                    <span>Street Address *</span>
                </label>
                <input
                    type="text"
                    value={value.street_address}
                    onChange={handleStreetChange}
                    placeholder="e.g. 123 Main St, Suite 100"
                    className={inputClasses}
                />
            </div>

            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}
        </div>
    );
}
