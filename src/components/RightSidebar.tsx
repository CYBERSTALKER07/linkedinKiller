import React from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    Bookmark,
    Users,
    MapPin,
    X,
    Star,
    Briefcase,
    ArrowRight
} from 'lucide-react';
import { cn } from '../lib/cva';
import Button from './ui/Button';
import WhoToFollowItem from './WhoToFollowItem';

// --- Interfaces ---

interface SearchResult {
    id: string;
    type: 'user';
    title: string;
    subtitle?: string;
    description: string;
    avatar?: string;
    verified?: boolean;
}

interface Company {
    id: string;
    name: string;
    logo_url?: string;
    industry?: string;
}

interface User {
    id: string;
    full_name: string;
    username: string;
    avatar_url?: string;
    verified?: boolean;
    bio?: string;
}

interface RightSidebarProps {
    isDark: boolean;
    sidebarSearchInput: string;
    setSidebarSearchInput: (value: string) => void;
    showSearchDropdown: boolean;
    setShowSearchDropdown: (show: boolean) => void;
    searchDropdownRef: React.RefObject<HTMLDivElement>;
    searchInputRef: React.RefObject<HTMLInputElement>;
    userSearchResults: SearchResult[];
    searchLoading: boolean;
    companiesLoading: boolean;
    recommendedCompanies: Company[];
    recommendedUsersLoading: boolean;
    recommendedUsers: User[];
    navigate: (path: string) => void;
}

// --- Sub-Components ---

const SearchWidget = ({
    isDark,
    input,
    setInput,
    showDropdown,
    setShowDropdown,
    inputRef,
    containerRef,
    results,
    loading,
    navigate
}: any) => {
    const isUsernameSearch = input.startsWith('@');

    return (
        <div className="relative group z-50" ref={containerRef}>
            <div className={cn(
                'flex items-center px-4 py-3 rounded-full transition-all duration-200 border shadow-sm',
                isDark
                    ? 'bg-[#161819] border-[#2F3336] focus-within:bg-black focus-within:border-blue-500'
                    : 'bg-gray-100 border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400'
            )}>
                <Search className={cn(
                    'w-4 h-4 mr-3 transition-colors',
                    isDark ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-gray-400 group-focus-within:text-blue-500'
                )} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search users, jobs..."
                    className={cn(
                        'bg-transparent border-none outline-none w-full text-sm placeholder-gray-500',
                        isDark ? 'text-white' : 'text-gray-900'
                    )}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                />
                {input && (
                    <button
                        onClick={() => {
                            setInput('');
                            setShowDropdown(false);
                        }}
                        className={cn(
                            'p-1 rounded-full transition-colors',
                            isDark ? 'hover:bg-gray-800 text-blue-400' : 'hover:bg-gray-200 text-blue-500'
                        )}
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (input || results.length > 0) && (
                <div className={cn(
                    'absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden z-50 max-h-[60vh] overflow-y-auto backdrop-blur-xl',
                    isDark ? 'bg-black/90 border-[#2F3336]' : 'bg-white/95 border-gray-100'
                )}>
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 text-sm">Searching...</div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            <div className={cn("px-4 py-2 text-xs font-bold uppercase tracking-wider", isDark ? "text-gray-500" : "text-gray-400")}>
                                People
                            </div>
                            {results.map((result: any) => (
                                <Link
                                    key={result.id}
                                    to={`/profile/${result.id}`}
                                    className={cn(
                                        'flex items-center px-4 py-3 transition-colors',
                                        isDark ? 'hover:bg-[#161819]' : 'hover:bg-gray-50'
                                    )}
                                    onClick={() => setShowDropdown(false)}
                                >
                                    {result.avatar ? (
                                        <img src={result.avatar} alt={result.title} className="w-10 h-10 rounded-full mr-3 object-cover ring-2 ring-gray-100/10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-700 to-gray-600 flex items-center justify-center mr-3 text-white font-bold shadow-inner">
                                            {result.title.charAt(0)}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className={cn('font-bold text-sm truncate', isDark ? 'text-white' : 'text-gray-900')}>
                                                {result.title}
                                            </span>
                                            {result.verified && (
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                            )}
                                        </div>
                                        <p className={cn(
                                            'text-xs truncate font-medium',
                                            isUsernameSearch
                                                ? 'text-blue-500'
                                                : isDark ? 'text-gray-500' : 'text-gray-500'
                                        )}>
                                            {result.subtitle}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : input ? (
                        <div className={cn('p-8 text-center text-sm flex flex-col items-center', isDark ? 'text-gray-500' : 'text-gray-600')}>
                            <span>No results for "{input}"</span>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};

const PremiumCard = ({ isDark, navigate }: { isDark: boolean, navigate: any }) => (
    <div className="relative overflow-hidden rounded-3xl p-5 mb-6 group cursor-pointer" onClick={() => navigate('/premium')}>
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-br from-[#FF8C00] to-[#FF0080] opacity-90 transition-opacity group-hover:opacity-100"></div>

        <div className="relative z-10">
            <h3 className="font-bold text-2xl font-serif mb-2 flex items-center text-white">
                <Star className="h-6 w-6 mr-2 fill-white animate-pulse" />
                Premium
            </h3>
            <p className="text-sm mb-4 text-white/90 font-medium leading-relaxed">
                Stand out with a verified badge, see who viewed your profile, and more.
            </p>
            <Button
                variant="ghost"
                className="w-full bg-white text-black hover:bg-gray-100 font-bold rounded-xl border-none"
                onClick={(e) => {
                    e.stopPropagation();
                    navigate('/premium');
                }}
            >
                Upgrade Now
            </Button>
        </div>
    </div>
);

const Footer = ({ isDark }: { isDark: boolean }) => (
    <div className={cn('text-[11px] space-y-3 px-4', isDark ? 'text-gray-500' : 'text-gray-400')}>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
            {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Accessibility', 'Ads Info'].map((item) => (
                <a key={item} href={`/${item.toLowerCase().replace(/ /g, '-')}`} className="hover:underline hover:text-gray-500 transition-colors">
                    {item}
                </a>
            ))}
        </div>
        <p className="opacity-80">© 2025 TalentLink Corp.</p>
    </div>
);

// --- Main Component ---

const RightSidebar: React.FC<RightSidebarProps> = ({
    isDark,
    sidebarSearchInput,
    setSidebarSearchInput,
    showSearchDropdown,
    setShowSearchDropdown,
    searchDropdownRef,
    searchInputRef,
    userSearchResults,
    searchLoading,
    companiesLoading,
    recommendedCompanies,
    recommendedUsersLoading,
    recommendedUsers,
    navigate,
}) => {
    return (
        <aside className={cn(
            'hidden xl:block w-[380px] h-screen sticky top-0',
            isDark ? 'bg-black border-l border-[#2F3336]' : 'bg-white border-l border-gray-100'
        )}>
            <div className="h-full overflow-y-auto scrollbar-hide px-6 py-4 pb-20">
                <div className="space-y-6">

                    {/* Search Component */}
                    <SearchWidget
                        isDark={isDark}
                        input={sidebarSearchInput}
                        setInput={setSidebarSearchInput}
                        showDropdown={showSearchDropdown}
                        setShowDropdown={setShowSearchDropdown}
                        inputRef={searchInputRef}
                        containerRef={searchDropdownRef}
                        results={userSearchResults}
                        loading={searchLoading}
                        navigate={navigate}
                    />

                    {/* Premium CTA */}
                    {/* <PremiumCard isDark={isDark} navigate={navigate} /> */}

                    {/* Job Recommendations */}
                    <div className={cn(
                        'rounded-3xl p-5 border shadow-xs',
                        isDark ? 'bg-black border-[#2F3336]' : 'bg-white border-gray-100 shadow-gray-200/50'
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={cn("font-bold text-xl font-serif flex items-center", isDark ? "text-white" : "text-gray-900")}>
                                <Briefcase className="h-5 w-5 mr-2" />
                                Jobs For You
                            </h3>
                        </div>

                        <div className="space-y-1">
                            {companiesLoading ? (
                                <div className="py-8 flex justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                                </div>
                            ) : recommendedCompanies && recommendedCompanies.length > 0 ? (
                                recommendedCompanies.map((company, index) => (
                                    <div
                                        key={company.id || index}
                                        className={cn(
                                            'p-3 rounded-2xl cursor-pointer transition-all duration-200 flex items-center gap-3 group',
                                            isDark ? 'hover:bg-[#2F3336]' : 'hover:bg-gray-50'
                                        )}
                                        onClick={() => navigate(`/company/${company.id}`)}
                                    >
                                        {company.logo_url ? (
                                            <img
                                                src={company.logo_url}
                                                alt={company.name}
                                                className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm bg-white"
                                            />
                                        ) : (
                                            <div className={cn(
                                                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white shadow-inner',
                                                'bg-linear-to-tr from-indigo-500 to-purple-500'
                                            )}>
                                                {company.name?.charAt(0) || 'C'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className={cn(
                                                'font-bold text-sm truncate group-hover:text-blue-500 transition-colors',
                                                isDark ? 'text-gray-200' : 'text-gray-900'
                                            )}>
                                                {company.name}
                                            </h4>
                                            <p className={cn(
                                                'text-xs truncate',
                                                isDark ? 'text-gray-500' : 'text-gray-500'
                                            )}>
                                                {company.industry || 'Technology'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-500 text-sm">
                                    No recommendations yet
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-800">
                            <button
                                className={cn(
                                    'text-sm font-medium hover:underline flex items-center gap-1',
                                    isDark ? 'text-blue-400' : 'text-blue-600'
                                )}
                                onClick={() => navigate('/explore')}
                            >
                                View more jobs <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    {/* Who to Follow */}
                    <div className={cn(
                        'rounded-3xl p-5 border shadow-xs',
                        isDark ? 'bg-black border-[#2F3336]' : 'bg-white border-gray-100 shadow-gray-200/50'
                    )}>
                        <h3 className={cn("text-xl font-bold mb-4 flex items-center", isDark ? "text-white" : "text-gray-900")}>
                            <Users className="h-5 w-5 mr-2" />
                            Who to follow
                        </h3>
                        <div className="space-y-4">
                            {recommendedUsersLoading ? (
                                <div className="py-8 flex justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
                                </div>
                            ) : recommendedUsers.length > 0 ? (
                                recommendedUsers.slice(0, 3).map((recommendedUser) => (
                                    <WhoToFollowItem
                                        key={recommendedUser.id}
                                        user={{
                                            id: recommendedUser.id,
                                            full_name: recommendedUser.full_name,
                                            username: recommendedUser.username,
                                            avatar_url: recommendedUser.avatar_url,
                                            verified: recommendedUser.verified,
                                            bio: recommendedUser.bio
                                        }}
                                        onNavigate={() => navigate(`/profile/${recommendedUser.id}`)}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-500 text-sm">
                                    No suggestions available
                                </div>
                            )}
                        </div>
                        <button
                            className={cn(
                                'w-full mt-4 py-2 rounded-xl text-sm font-medium transition-colors',
                                isDark
                                    ? 'bg-black text-gray-300 hover:bg-[#3d4144] hover:text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                            )}
                            onClick={() => navigate('/explore')}
                        >
                            Show more
                        </button>
                    </div>

                    <PremiumCard isDark={isDark} navigate={navigate} />

                    <Footer isDark={isDark} />
                </div>

            </div>
        </aside>
    );
};

export default RightSidebar;