import React, { useState } from 'react';
import { Search, Share2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { NewEncryptedPassword } from '../../../services/types';
import EncryptionService from '../../../services/EncryptionService';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  selectedItems: NewEncryptedPassword[];
  type: 'passwords' | 'keys';
}

interface UserSearchResult {
  id: string;
  email: string;
  username: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  selectedItems,
  type
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await EncryptionService.API.SearchUsers(query);
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      const users = await response.json();
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    }
  };

  const handleShare = async () => {
    if (!selectedUser) return;

    setIsSharing(true);
    setError(null);

    try {
      const response = await EncryptionService.API.ShareItems({
        recipientEmail: selectedUser.email,
        items: selectedItems,
        type
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share items');
      }

      onClose();
    } catch (error) {
      console.error('Error sharing items:', error);
      setError(error instanceof Error ? error.message : 'Failed to share items');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Share {type}</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative mb-4">
          <div className="flex items-center border rounded-lg p-2">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="email"
              placeholder="Search by email..."
              className="flex-1 outline-none"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {searchResults.length > 0 && !selectedUser && (
            <div className="absolute w-full bg-white border rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedUser(user);
                    setSearchResults([]);
                  }}
                >
                  <div className="font-medium">{user.email}</div>
                  {user.username && (
                    <div className="text-sm text-gray-500">{user.username}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="mb-4 p-2 bg-gray-50 rounded-lg flex justify-between items-center">
            <div>
              <div className="font-medium">{selectedUser.email}</div>
              {selectedUser.username && (
                <div className="text-sm text-gray-500">{selectedUser.username}</div>
              )}
            </div>
            <Button
              onClick={() => setSelectedUser(null)}
              variant="ghost"
              className="p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button
            onClick={onClose}
            variant="ghost"
            className="px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={!selectedUser || isSharing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {isSharing ? 'Sharing...' : 'Share'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareDialog;
