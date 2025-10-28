import { useState, useEffect } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import Select, { components, MenuListProps } from 'react-select';
import type { Chat, Mapping } from '../App';

type Filter = {
  words: string[];
  regex: string;
  priceAdjustment: number;
  returnIfContainsLink: boolean;
  returnIfContainsPhoneNumber: boolean;
  ignoredMediaMimetypes: string[];
  disabled: boolean;
};

type Props = {
  mappings: Mapping[];
  onAddMapping: (mapping: Mapping) => void;
  onDeleteMapping: (id: string) => void;
  onEditMapping: (id: string, updatedMapping: Mapping) => void;
  onContinue: () => void;
};

type Option = {
  value: string;
  label: string;
  data: Chat;
};

export default function SetupForwarding({
  mappings,
  onAddMapping,
  onDeleteMapping,
  onEditMapping,
  onContinue
}: Props) {
  // Shared Tailwind classes for inputs/checkboxes
  const inputClasses =
    "block w-full rounded-md text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-offset-2 focus:ring-green-500";
  const checkboxClasses = "form-checkbox h-4 w-4 text-green-500 border-gray-300 rounded";

  // Track dark mode state using a mutation observer so custom styles update when toggled
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Custom styles for react-select that update based on isDark
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: isDark ? '#374151' : '#fff', // dark:bg-gray-700
      borderColor: isDark ? '#4b5563' : '#d1d5db',    // dark:border-gray-600
      color: isDark ? '#fff' : '#000',
      boxShadow: state.isFocused ? `0 0 0 2px #10b981` : 0,
      '&:hover': {
        borderColor: isDark ? '#6b7280' : '#9ca3af'
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: isDark ? '#374151' : '#fff',
      color: isDark ? '#fff' : '#000',
      zIndex: 9999
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? (isDark ? '#4b5563' : '#f3f4f6')
        : (isDark ? '#374151' : '#fff'),
      color: isDark ? '#fff' : '#000',
      cursor: 'pointer'
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: isDark ? '#fff' : '#000'
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: isDark ? '#9ca3af' : '#6b7280'
    })
  };

  // State for chats, groups, and filters
  const [sourceChat, setSourceChat] = useState<string>('');
  const [destinationChat, setDestinationChat] = useState<string>('');
  const [groups, setGroups] = useState<Chat[]>([]);
  const [filter, setFilter] = useState<Filter>({
    words: [],
    regex: '',
    priceAdjustment: 0,
    returnIfContainsLink: false,
    returnIfContainsPhoneNumber: false,
    ignoredMediaMimetypes: [],
    disabled: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pagination state
  const [offset, setOffset] = useState<number>(0);
  const limit = 25;
  const [hasMore, setHasMore] = useState<boolean>(true);

  // State for editing filter only
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [editFilter, setEditFilter] = useState<Filter>({
    words: [],
    regex: '',
    priceAdjustment: 0,
    returnIfContainsLink: false,
    returnIfContainsPhoneNumber: false,
    disabled: false,
    ignoredMediaMimetypes: [],
  });
  const [editSourceChat, setEditSourceChat] = useState<string>('');
  const [editDestinationChat, setEditDestinationChat] = useState<string>('');

  // State for inline editing
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditField, setInlineEditField] = useState<string>('');
  const [inlineEditValue, setInlineEditValue] = useState<string>('');

  // State for delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // State for mapping edit dropdowns
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingDestinationId, setEditingDestinationId] = useState<string | null>(null);

  // Build options for react-select from groups
  const chatOptions: Option[] = groups.map(chat => ({
    value: chat.id,
    label: `${chat.id} - ${chat.name}`,
    data: chat,
  }));

  // Custom MenuList to include a "Load more" button inside the dropdown
  const CustomMenuList = (props: MenuListProps<Option, false>) => (
    <>
      <components.MenuList {...props} />
      {hasMore && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            loadMoreGroups();
          }}
          className="cursor-pointer p-2 text-center border-t border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400"
        >
          Load more groups
        </div>
      )}
    </>
  );

  // Fetch groups with pagination
  const fetchGroups = async (currentOffset: number) => {
    try {
      const response = await fetch(
        `/api/sessions/default/groups?limit=${limit}&offset=${currentOffset}`
      );
      const data = await response.json();

      const groupsArr: Chat[] = Object.keys(data).map(key => {
        const group = data[key];
        return {
          id: group.id,
          name: group.subject,
          lastMessage: '',
          avatar:
            'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQx4wpk1C0SSngnQfmNOHouDuZSK53v8Vru2Q&s',
        };
      });

      if (groupsArr.length < limit) {
        setHasMore(false);
      }
      setGroups(prev => {
        const combined = [...prev, ...groupsArr];
        const unique = combined.filter((group, index, self) =>
          index === self.findIndex(g => g.id === group.id)
        );
        return unique.sort((a, b) => a.name.localeCompare(b.name));
      });
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    fetchGroups(0);
  }, []);

  const loadMoreGroups = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchGroups(newOffset);
  };

  // Validate filter object
  const validateFilterObj = (f: Filter) => {
    const newErrors: Record<string, string> = {};
    if (f.regex) {
      try {
        new RegExp(f.regex);
      } catch (e) {
        newErrors.regex = 'Invalid regular expression pattern';
      }
    }
    if (isNaN(f.priceAdjustment)) {
      newErrors.priceAdjustment = 'Price increase must be a number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle adding a mapping
  const handleAddMapping = () => {
    if (!validateFilterObj(filter)) return;
    const source = groups.find(c => c.id === sourceChat);
    const destination = groups.find(c => c.id === destinationChat);
    if (source && destination) {
      onAddMapping({
        id: `${source.id}-${destination.id}`,
        source,
        destination,
        filter: {
          ...filter,
          words: filter.words.map(w => w.trim()).filter(Boolean),
        },
      });
      // Reset form
      setSourceChat('');
      setDestinationChat('');
      setFilter({
        words: [],
        regex: '',
        priceAdjustment: 0,
        returnIfContainsLink: false,
        returnIfContainsPhoneNumber: false,
        ignoredMediaMimetypes: [],
        disabled: false,
      });
      setErrors({});
    }
  };

  // Handle saving edits for a mapping
  const handleSaveEdit = () => {
    if (!editingMappingId) return;
    if (!validateFilterObj(editFilter)) return;
    
    // Validate that source and destination are selected
    if (!editSourceChat || !editDestinationChat) {
      setErrors({ general: 'Please select both source and destination chats' });
      return;
    }
    
    const originalMapping = mappings.find(m => m.id === editingMappingId);
    if (!originalMapping) return;
    
    const newSource = groups.find(c => c.id === editSourceChat);
    const newDestination = groups.find(c => c.id === editDestinationChat);
    
    if (!newSource || !newDestination) return;
    
    const updatedMapping: Mapping = {
      ...originalMapping,
      id: `${newSource.id}-${newDestination.id}`,
      source: newSource,
      destination: newDestination,
      filter: {
        words: editFilter.words,
        regex: editFilter.regex,
        priceAdjustment: editFilter.priceAdjustment,
        returnIfContainsLink: editFilter.returnIfContainsLink,
        returnIfContainsPhoneNumber: editFilter.returnIfContainsPhoneNumber,
        ignoredMediaMimetypes: editFilter.ignoredMediaMimetypes,
        disabled: editFilter.disabled,
      },
    };
    onEditMapping(editingMappingId, updatedMapping);
    setEditingMappingId(null);
    setErrors({});
  };

  // Handle inline editing
  const startInlineEdit = (mappingId: string, field: string, currentValue: string) => {
    setInlineEditingId(mappingId);
    setInlineEditField(field);
    setInlineEditValue(currentValue);
  };

  const saveInlineEdit = (mappingId: string) => {
    if (!inlineEditValue.trim()) return;
    
    const mapping = mappings.find(m => m.id === mappingId);
    if (!mapping) return;
    
    let updatedMapping: Mapping;
    
    if (inlineEditField === 'words') {
      const words = inlineEditValue.split(',').map(w => w.trim()).filter(Boolean);
      updatedMapping = {
        ...mapping,
        filter: {
          words,
          regex: mapping.filter?.regex || '',
          priceAdjustment: mapping.filter?.priceAdjustment ?? 0,
          returnIfContainsLink: mapping.filter?.returnIfContainsLink || false,
          returnIfContainsPhoneNumber: mapping.filter?.returnIfContainsPhoneNumber || false,
          ignoredMediaMimetypes: mapping.filter?.ignoredMediaMimetypes || [],
          disabled: mapping.filter?.disabled || false
        }
      };
    } else if (inlineEditField === 'regex') {
      updatedMapping = {
        ...mapping,
        filter: {
          words: mapping.filter?.words || [],
          regex: inlineEditValue,
          priceAdjustment: mapping.filter?.priceAdjustment ?? 0,
          returnIfContainsLink: mapping.filter?.returnIfContainsLink || false,
          returnIfContainsPhoneNumber: mapping.filter?.returnIfContainsPhoneNumber || false,
          ignoredMediaMimetypes: mapping.filter?.ignoredMediaMimetypes || [],
          disabled: mapping.filter?.disabled || false
        }
      };
    } else if (inlineEditField === 'priceAdjustment') {
      const value = parseFloat(inlineEditValue) || 0;
      updatedMapping = {
        ...mapping,
        filter: {
          words: mapping.filter?.words || [],
          regex: mapping.filter?.regex || '',
          priceAdjustment: value,
          returnIfContainsLink: mapping.filter?.returnIfContainsLink || false,
          returnIfContainsPhoneNumber: mapping.filter?.returnIfContainsPhoneNumber || false,
          ignoredMediaMimetypes: mapping.filter?.ignoredMediaMimetypes || [],
          disabled: mapping.filter?.disabled || false
        }
      };
    } else if (inlineEditField === 'ignoredMediaMimetypes') {
      const mimeTypes = inlineEditValue.split(',').map(m => m.trim()).filter(Boolean);
      updatedMapping = {
        ...mapping,
        filter: {
          words: mapping.filter?.words || [],
          regex: mapping.filter?.regex || '',
          priceAdjustment: mapping.filter?.priceAdjustment ?? 0,
          returnIfContainsLink: mapping.filter?.returnIfContainsLink || false,
          returnIfContainsPhoneNumber: mapping.filter?.returnIfContainsPhoneNumber || false,
          ignoredMediaMimetypes: mimeTypes,
          disabled: mapping.filter?.disabled || false
        }
      };
    } else {
      return;
    }
    
    onEditMapping(mappingId, updatedMapping);
    setInlineEditingId(null);
    setInlineEditField('');
    setInlineEditValue('');
  };

  const cancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineEditField('');
    setInlineEditValue('');
  };

  // Handle word filter changes for add form
  const handleWordsChange = (value: string) => {
    setFilter(prev => ({
      ...prev,
      words: value.split(',').map(w => w.trim()).filter(Boolean),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="rounded-lg transition-colors duration-200 bg-white dark:bg-gray-800 shadow">
        <div className="px-6 py-8">
          <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
            Set Up Message Forwarding
          </h1>

          {/* ADD MAPPING FORM */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Source Chat Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  Source Chat
                </label>
                <Select
                  options={chatOptions}
                  value={chatOptions.find(option => option.value === sourceChat) || null}
                  onChange={(option) => setSourceChat(option?.value || '')}
                  placeholder="Select a source chat"
                  className="w-full"
                  classNamePrefix="react-select"
                  styles={customStyles}
                  components={{ MenuList: CustomMenuList }}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
              {/* Destination Chat Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  Destination Chat
                </label>
                <Select
                  options={chatOptions}
                  value={chatOptions.find(option => option.value === destinationChat) || null}
                  onChange={(option) => setDestinationChat(option?.value || '')}
                  placeholder="Select a destination chat"
                  className="w-full"
                  classNamePrefix="react-select"
                  styles={customStyles}
                  components={{ MenuList: CustomMenuList }}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            </div>

            {/* FILTERING OPTIONS */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  Word Filters (comma-separated)
                </label>
                <input
                  type="text"
                  value={filter.words.join(', ')}
                  onChange={e => handleWordsChange(e.target.value)}
                  placeholder="e.g., urgent, important, sale"
                  className={inputClasses}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Messages containing these words will be forwarded
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  Regex Pattern
                </label>
                <input
                  type="text"
                  value={filter.regex}
                  onChange={e =>
                    setFilter(prev => ({ ...prev, regex: e.target.value }))
                  }
                  placeholder="e.g., \\b\\d{4}\\b"
                  className={`${inputClasses} ${errors.regex ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`}
                />
                {errors.regex && (
                  <p className="mt-1 text-sm text-red-600">{errors.regex}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Messages matching this pattern will be forwarded
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  Price Increase
                </label>
                <input
                  type="number"
                  value={filter.priceAdjustment}
                  onChange={e =>
                    setFilter(prev => ({
                      ...prev,
                      priceAdjustment: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="e.g., 10 for increase, -10 for decrease"
                  className={`${inputClasses} ${errors.priceAdjustment ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`}
                />
                {errors.priceAdjustment && (
                  <p className="mt-1 text-sm text-red-600">{errors.priceAdjustment}</p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Adjust prices in forwarded messages (positive for increase, negative for decrease)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                  Ignored Media MIME Types (comma-separated)
                </label>
                <input
                  type="text"
                  value={filter.ignoredMediaMimetypes.join(', ')}
                  onChange={e =>
                    setFilter(prev => ({
                      ...prev,
                      ignoredMediaMimetypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                    }))
                  }
                  placeholder="e.g., image, video"
                  className={inputClasses}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  If the message contains media and its MIME type includes one of these values, it will not be forwarded.
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={filter.returnIfContainsLink}
                    onChange={e =>
                      setFilter(prev => ({ ...prev, returnIfContainsLink: e.target.checked }))
                    }
                    className={checkboxClasses}
                  />
                  <span>Ignore if message contains a link</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={filter.returnIfContainsPhoneNumber}
                    onChange={e =>
                      setFilter(prev => ({
                        ...prev,
                        returnIfContainsPhoneNumber: e.target.checked,
                      }))
                    }
                    className={checkboxClasses}
                  />
                  <span>Ignore if message contains a phone number</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleAddMapping}
              disabled={!sourceChat || !destinationChat}
              className="w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </button>
          </div>

          {/* CURRENT MAPPINGS (View + Edit Filter) */}
          {mappings.length > 0 && (
            <>
              <div className="mt-8">
                <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  Current Mappings
                </h2>
                <div className="space-y-4">
                  {mappings.map(mapping => {
                    const isEditing = editingMappingId === mapping.id;
                    return (
                      <div
                        key={mapping.id}
                        className="p-6 rounded-xl border transition-all duration-200 bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md"
                      >
                        {isEditing ? (
                          <div>
                            <div className="mb-4">
                              <p className="font-medium text-gray-900 dark:text-white">
                                Editing mapping:
                              </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                              {/* Source Chat Dropdown */}
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                                  Source Chat
                                </label>
                                <Select
                                  options={chatOptions}
                                  value={chatOptions.find(option => option.value === editSourceChat) || null}
                                  onChange={(option) => setEditSourceChat(option?.value || '')}
                                  placeholder="Select a source chat"
                                  className="w-full"
                                  classNamePrefix="react-select"
                                  styles={customStyles}
                                  components={{ MenuList: CustomMenuList }}
                                  menuPortalTarget={document.body}
                                  menuPosition="fixed"
                                />
                              </div>
                              {/* Destination Chat Dropdown */}
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                                  Destination Chat
                                </label>
                                <Select
                                  options={chatOptions}
                                  value={chatOptions.find(option => option.value === editDestinationChat) || null}
                                  onChange={(option) => setEditDestinationChat(option?.value || '')}
                                  placeholder="Select a destination chat"
                                  className="w-full"
                                  classNamePrefix="react-select"
                                  styles={customStyles}
                                  components={{ MenuList: CustomMenuList }}
                                  menuPortalTarget={document.body}
                                  menuPosition="fixed"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                                  Word Filters (comma-separated)
                                </label>
                                <input
                                  type="text"
                                  value={editFilter.words.join(', ')}
                                  onChange={e =>
                                    setEditFilter(prev => ({
                                      ...prev,
                                      words: e.target.value.split(',').map(w => w.trim()).filter(Boolean),
                                    }))
                                  }
                                  className={inputClasses}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                                  Regex Pattern
                                </label>
                                <input
                                  type="text"
                                  value={editFilter.regex}
                                  onChange={e =>
                                    setEditFilter(prev => ({
                                      ...prev,
                                      regex: e.target.value,
                                    }))
                                  }
                                  className={`${inputClasses} ${errors.regex ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`}
                                />
                                {errors.regex && (
                                  <p className="mt-1 text-sm text-red-600">{errors.regex}</p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                                  Price Increase
                                </label>
                                <input
                                  type="number"
                                  value={editFilter.priceAdjustment}
                                  onChange={e =>
                                    setEditFilter(prev => ({
                                      ...prev,
                                      priceAdjustment: parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className={`${inputClasses} ${errors.priceAdjustment ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`}
                                />
                                {errors.priceAdjustment && (
                                  <p className="mt-1 text-sm text-red-600">{errors.priceAdjustment}</p>
                                )}
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-200">
                                  Ignored Media MIME Types (comma-separated)
                                </label>
                                <input
                                  type="text"
                                  value={editFilter.ignoredMediaMimetypes.join(', ')}
                                  onChange={e =>
                                    setEditFilter(prev => ({
                                      ...prev,
                                      ignoredMediaMimetypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                    }))
                                  }
                                  placeholder="e.g., image, video"
                                  className={inputClasses}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
                                Ignored Media MIME Types (comma-separated)
                              </label>
                              <input
                                type="text"
                                value={editFilter.ignoredMediaMimetypes.join(', ')}
                                onChange={e =>
                                  setEditFilter(prev => ({
                                    ...prev,
                                    ignoredMediaMimetypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                  }))
                                }
                                placeholder="e.g., image, video"
                                className={inputClasses}
                              />
                              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                If the media's MIME type includes any of these values, the message will not be forwarded.
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                              <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-200 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={editFilter.returnIfContainsLink}
                                  onChange={e =>
                                    setEditFilter(prev => ({
                                      ...prev,
                                      returnIfContainsLink: e.target.checked,
                                    }))
                                  }
                                  className={checkboxClasses}
                                />
                                <span>Ignore if message contains a link</span>
                              </label>
                              <label className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-200 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={editFilter.returnIfContainsPhoneNumber}
                                  onChange={e =>
                                    setEditFilter(prev => ({
                                      ...prev,
                                      returnIfContainsPhoneNumber: e.target.checked,
                                    }))
                                  }
                                  className={checkboxClasses}
                                />
                                <span>Ignore if message contains a phone number</span>
                              </label>
                            </div>

                            {errors.general && (
                              <p className="mt-2 text-sm text-red-600">{errors.general}</p>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                              <button
                                onClick={handleSaveEdit}
                                className="flex-1 sm:flex-none px-6 py-3 rounded-lg text-sm font-medium bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMappingId(null);
                                  setErrors({});
                                }}
                                className="flex-1 sm:flex-none px-6 py-3 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                                                      <div>
                              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                                                {/* Chat Information - Responsive Layout */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                  {/* Source Chat */}
                                  <div className="flex items-center min-w-0 flex-1">
                                    <img
                                      src={mapping.source.avatar}
                                      alt={mapping.source.name}
                                      className="w-12 h-12 rounded-full flex-shrink-0"
                                    />
                                    <div className="ml-3 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white break-words">
                                        {mapping.source.name}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Source
                                      </p>
                                      <div className="mt-2">
                                        {editingSourceId === mapping.id ? (
                                          <div className="space-y-2">
                                            <Select
                                              options={chatOptions}
                                              value={chatOptions.find(option => option.value === mapping.source.id) || null}
                                              onChange={(option) => {
                                                if (option) {
                                                  const updatedMapping: Mapping = {
                                                    ...mapping,
                                                    id: `${option.value}-${mapping.destination.id}`,
                                                    source: option.data,
                                                  };
                                                  onEditMapping(mapping.id, updatedMapping);
                                                  setEditingSourceId(null);
                                                }
                                              }}
                                              placeholder="Select source chat"
                                              className="w-full"
                                              classNamePrefix="react-select"
                                              styles={customStyles}
                                              components={{ MenuList: CustomMenuList }}
                                              menuPortalTarget={document.body}
                                              menuPosition="fixed"
                                            />
                                            <div className="flex gap-1">
                                              <button
                                                onClick={() => setEditingSourceId(null)}
                                                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => setEditingSourceId(mapping.id)}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Arrow - Hidden on small screens, shown on medium+ */}
                                  <div className="hidden sm:flex items-center justify-center w-8">
                                    <ArrowRight className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                                  </div>

                                  {/* Destination Chat */}
                                  <div className="flex items-center min-w-0 flex-1">
                                    <img
                                      src={mapping.destination.avatar}
                                      alt={mapping.destination.name}
                                      className="w-12 h-12 rounded-full flex-shrink-0"
                                    />
                                    <div className="ml-3 min-w-0">
                                      <p className="font-medium text-gray-900 dark:text-white break-words">
                                        {mapping.destination.name}
                                      </p>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Destination
                                      </p>
                                      <div className="mt-2">
                                        {editingDestinationId === mapping.id ? (
                                          <div className="space-y-2">
                                            <Select
                                              options={chatOptions}
                                              value={chatOptions.find(option => option.value === mapping.destination.id) || null}
                                              onChange={(option) => {
                                                if (option) {
                                                  const updatedMapping: Mapping = {
                                                    ...mapping,
                                                    id: `${mapping.source.id}-${option.value}`,
                                                    destination: option.data,
                                                  };
                                                  onEditMapping(mapping.id, updatedMapping);
                                                  setEditingDestinationId(null);
                                                }
                                              }}
                                              placeholder="Select destination chat"
                                              className="w-full"
                                              classNamePrefix="react-select"
                                              styles={customStyles}
                                              components={{ MenuList: CustomMenuList }}
                                              menuPortalTarget={document.body}
                                              menuPosition="fixed"
                                            />
                                            <div className="flex gap-1">
                                              <button
                                                onClick={() => setEditingDestinationId(null)}
                                                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            onClick={() => setEditingDestinationId(mapping.id)}
                                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                            </div>

                            {/* Filter Summary - Responsive Grid Layout */}
                            {mapping.filter && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {/* Word Filters - Always Visible */}
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <div className="flex items-center mb-2">
                                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                        Word Filters
                                      </span>
                                      <span className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                                        {mapping.filter?.words?.length || 0}
                                      </span>
                                      <button
                                        onClick={() => startInlineEdit(mapping.id, 'words', (mapping.filter?.words || []).join(', '))}
                                        className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                    {inlineEditingId === mapping.id && inlineEditField === 'words' ? (
                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={inlineEditValue}
                                          onChange={(e) => setInlineEditValue(e.target.value)}
                                          className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          placeholder="Enter words separated by commas"
                                        />
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => saveInlineEdit(mapping.id)}
                                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={cancelInlineEdit}
                                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        className="flex flex-wrap gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors min-h-[24px]"
                                        onDoubleClick={() => startInlineEdit(mapping.id, 'words', (mapping.filter?.words || []).join(', '))}
                                      >
                                        {mapping.filter?.words && mapping.filter.words.length > 0 ? (
                                          mapping.filter.words.map((word, index) => (
                                            <span
                                              key={index}
                                              className="px-2 py-1 text-xs rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                            >
                                              {word}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                            No word filters set. Double-click to add words.
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Regex Pattern - Always Visible */}
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <div className="flex items-center mb-2">
                                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                        Regex Pattern
                                      </span>
                                      <button
                                        onClick={() => startInlineEdit(mapping.id, 'regex', mapping.filter?.regex || '')}
                                        className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                    {inlineEditingId === mapping.id && inlineEditField === 'regex' ? (
                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={inlineEditValue}
                                          onChange={(e) => setInlineEditValue(e.target.value)}
                                          className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                                          placeholder="Enter regex pattern"
                                        />
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => saveInlineEdit(mapping.id)}
                                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={cancelInlineEdit}
                                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        className="min-h-[32px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                                        onDoubleClick={() => startInlineEdit(mapping.id, 'regex', mapping.filter?.regex || '')}
                                      >
                                        {mapping.filter?.regex ? (
                                          <code className="block px-3 py-2 text-xs rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-mono break-all">
                                            {mapping.filter.regex}
                                          </code>
                                        ) : (
                                          <span className="text-xs text-gray-400 dark:text-gray-500 italic px-3 py-2 block">
                                            No regex pattern set. Double-click to add pattern.
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Price Increase - Always Visible */}
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <div className="flex items-center mb-2">
                                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                        Price Increase
                                      </span>
                                      <button
                                        onClick={() => startInlineEdit(mapping.id, 'priceAdjustment', (mapping.filter?.priceAdjustment ?? 0).toString())}
                                        className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                    {inlineEditingId === mapping.id && inlineEditField === 'priceAdjustment' ? (
                                      <div className="space-y-2">
                                        <input
                                          type="number"
                                          value={inlineEditValue}
                                          onChange={(e) => setInlineEditValue(e.target.value)}
                                          className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          placeholder="Enter price increase amount"
                                        />
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => saveInlineEdit(mapping.id)}
                                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={cancelInlineEdit}
                                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        className="min-h-[32px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors flex items-center"
                                        onDoubleClick={() => startInlineEdit(mapping.id, 'priceAdjustment', (mapping.filter?.priceAdjustment ?? 0).toString())}
                                      >
                                        {(mapping.filter?.priceAdjustment ?? 0) !== 0 ? (
                                          <span
                                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                                              (mapping.filter?.priceAdjustment ?? 0) > 0
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                            }`}
                                          >
                                            {(mapping.filter?.priceAdjustment ?? 0) > 0 ? '+' : ''}
                                            {mapping.filter?.priceAdjustment ?? 0}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                            No price increase amount set. Double-click to add.
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Media MIME Types - Always Visible */}
                                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <div className="flex items-center mb-2">
                                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                        Ignored Media
                                      </span>
                                      <span className="ml-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                                        {mapping.filter?.ignoredMediaMimetypes?.length || 0}
                                      </span>
                                      <button
                                        onClick={() => startInlineEdit(mapping.id, 'ignoredMediaMimetypes', (mapping.filter?.ignoredMediaMimetypes || []).join(', '))}
                                        className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                    {inlineEditingId === mapping.id && inlineEditField === 'ignoredMediaMimetypes' ? (
                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={inlineEditValue}
                                          onChange={(e) => setInlineEditValue(e.target.value)}
                                          className="w-full px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                          placeholder="Enter MIME types separated by commas"
                                        />
                                        <div className="flex gap-1">
                                          <button
                                            onClick={() => saveInlineEdit(mapping.id)}
                                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={cancelInlineEdit}
                                            className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div 
                                        className="flex flex-wrap gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors min-h-[24px]"
                                        onDoubleClick={() => startInlineEdit(mapping.id, 'ignoredMediaMimetypes', (mapping.filter?.ignoredMediaMimetypes || []).join(', '))}
                                      >
                                        {mapping.filter?.ignoredMediaMimetypes && mapping.filter.ignoredMediaMimetypes.length > 0 ? (
                                          mapping.filter.ignoredMediaMimetypes.map((mime, index) => (
                                            <span
                                              key={index}
                                              className="px-2 py-1 text-xs rounded-md bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                            >
                                              {mime}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                                            No ignored media types set. Double-click to add types.
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Processing Rules */}
                                  {(mapping.filter.returnIfContainsLink ||
                                    mapping.filter.returnIfContainsPhoneNumber ||
                                    mapping.filter.disabled) && (
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 sm:col-span-2 lg:col-span-3">
                                      <div className="flex items-center mb-2">
                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                          Processing Rules
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {mapping.filter.returnIfContainsLink && (
                                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            Ignore Links
                                          </span>
                                        )}
                                        {mapping.filter.returnIfContainsPhoneNumber && (
                                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            Ignore Phone Numbers
                                          </span>
                                        )}
                                        {mapping.filter.disabled && (
                                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                                            <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                            Forwarding Disabled
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action Buttons - Moved below the filter summary */}
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => {
                                      const updatedMapping: Mapping = {
                                        ...mapping,
                                        filter: {
                                          words: mapping.filter?.words || [],
                                          regex: mapping.filter?.regex || '',
                                          priceAdjustment: mapping.filter?.priceAdjustment ?? 0,
                                          returnIfContainsLink: mapping.filter?.returnIfContainsLink || false,
                                          returnIfContainsPhoneNumber: mapping.filter?.returnIfContainsPhoneNumber || false,
                                          ignoredMediaMimetypes: mapping.filter?.ignoredMediaMimetypes || [],
                                          disabled: !mapping.filter?.disabled
                                        }
                                      };
                                      onEditMapping(mapping.id, updatedMapping);
                                    }}
                                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                      mapping.filter?.disabled
                                        ? 'bg-green-500 hover:bg-green-600 text-white'
                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                    }`}
                                  >
                                    {mapping.filter?.disabled ? 'Enable' : 'Disable'}
                                  </button>
                                <button
                                  onClick={() => {
                                    const updatedMapping: Mapping = {
                                      ...mapping,
                                      filter: {
                                        words: mapping.filter?.words || [],
                                        regex: mapping.filter?.regex || '',
                                        priceAdjustment: mapping.filter?.priceAdjustment ?? 0,
                                        returnIfContainsLink: !mapping.filter?.returnIfContainsLink,
                                        returnIfContainsPhoneNumber: mapping.filter?.returnIfContainsPhoneNumber || false,
                                        ignoredMediaMimetypes: mapping.filter?.ignoredMediaMimetypes || [],
                                        disabled: mapping.filter?.disabled || false
                                      }
                                    };
                                    onEditMapping(mapping.id, updatedMapping);
                                  }}
                                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                    mapping.filter?.returnIfContainsLink
                                      ? 'bg-green-500 hover:bg-green-600 text-white'
                                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                                  }`}
                                >
                                  {mapping.filter?.returnIfContainsLink ? 'Allow Links' : 'Ignore Links'}
                                </button>
                                <button
                                  onClick={() => {
                                    const updatedMapping: Mapping = {
                                      ...mapping,
                                      filter: {
                                        words: mapping.filter?.words || [],
                                        regex: mapping.filter?.regex || '',
                                        priceAdjustment: mapping.filter?.priceAdjustment ?? 0,
                                        returnIfContainsLink: mapping.filter?.returnIfContainsLink || false,
                                        returnIfContainsPhoneNumber: !mapping.filter?.returnIfContainsPhoneNumber,
                                        ignoredMediaMimetypes: mapping.filter?.ignoredMediaMimetypes || [],
                                        disabled: mapping.filter?.disabled || false
                                      }
                                    };
                                    onEditMapping(mapping.id, updatedMapping);
                                  }}
                                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                    mapping.filter?.returnIfContainsPhoneNumber
                                      ? 'bg-green-500 hover:bg-green-600 text-white'
                                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                                  }`}
                                >
                                  {mapping.filter?.returnIfContainsPhoneNumber ? 'Allow Phone' : 'Ignore Phone'}
                                </button>
                                </div>
                                <button
                                  onClick={() => setDeleteConfirmId(mapping.id)}
                                  className="px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-red-100 dark:hover:bg-red-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={onContinue}
                  disabled={mappings.length === 0}
                  className="w-full flex justify-center items-center py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Confirm Deletion
            </h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete this mapping? This action cannot be undone.
              </p>
            </div>
            <div className="items-center px-4 py-3">
              <button
                onClick={() => {
                  onDeleteMapping(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="mt-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
