import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BookOpen, Heart, Star, Trash2, Edit, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Collection {
  id: string;
  name: string;
  description: string;
  theme: string;
  tags: string[];
  items: any[];
  isPublic: boolean;
  createdAt: string;
}

interface CuratedListsProps {
  className?: string;
}

export const CuratedLists: React.FC<CuratedListsProps> = ({ className = "" }) => {
  const [collections, setCollections] = useState<Collection[]>([
    {
      id: '1',
      name: 'Emotional Rollercoasters',
      description: 'Anime that will make you cry, laugh, and everything in between',
      theme: 'emotional',
      tags: ['drama', 'slice-of-life', 'tearjerker'],
      items: [],
      isPublic: true,
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Power Fantasy',
      description: 'Overpowered protagonists and epic battles',
      theme: 'action',
      tags: ['action', 'shounen', 'overpowered'],
      items: [],
      isPublic: false,
      createdAt: '2024-01-15'
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    theme: 'general',
    tags: [] as string[],
    isPublic: true
  });
  const [newTag, setNewTag] = useState('');

  const { toast } = useToast();

  const themes = [
    { value: 'general', label: 'General', color: 'bg-gray-500' },
    { value: 'emotional', label: 'Emotional', color: 'bg-pink-500' },
    { value: 'action', label: 'Action', color: 'bg-red-500' },
    { value: 'comedy', label: 'Comedy', color: 'bg-yellow-500' },
    { value: 'romance', label: 'Romance', color: 'bg-rose-500' },
    { value: 'mystery', label: 'Mystery', color: 'bg-purple-500' },
    { value: 'horror', label: 'Horror', color: 'bg-gray-800' },
    { value: 'fantasy', label: 'Fantasy', color: 'bg-emerald-500' },
    { value: 'sci-fi', label: 'Sci-Fi', color: 'bg-blue-500' }
  ];

  const handleCreateCollection = () => {
    if (!newCollection.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a collection name.",
        variant: "destructive"
      });
      return;
    }

    const collection: Collection = {
      id: Date.now().toString(),
      ...newCollection,
      items: [],
      createdAt: new Date().toISOString()
    };

    setCollections(prev => [...prev, collection]);
    setNewCollection({
      name: '',
      description: '',
      theme: 'general',
      tags: [],
      isPublic: true
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Success",
      description: "Collection created successfully!",
    });
  };

  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    toast({
      title: "Success",
      description: "Collection deleted successfully!",
    });
  };

  const addTag = () => {
    if (newTag.trim() && !newCollection.tags.includes(newTag.trim())) {
      setNewCollection(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewCollection(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getThemeColor = (theme: string) => {
    return themes.find(t => t.value === theme)?.color || 'bg-gray-500';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Collections</h2>
          <p className="text-muted-foreground">Organize your anime and manga into custom collections</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>
                Create a custom collection to organize your anime and manga
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Collection Name</label>
                <Input
                  placeholder="Enter collection name..."
                  value={newCollection.name}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your collection..."
                  value={newCollection.description}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Theme</label>
                <Select 
                  value={newCollection.theme} 
                  onValueChange={(value) => setNewCollection(prev => ({ ...prev, theme: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themes.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${theme.color}`} />
                          {theme.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {newCollection.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={newCollection.isPublic}
                  onChange={(e) => setNewCollection(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <label htmlFor="public" className="text-sm">Make this collection public</label>
              </div>

              <Button onClick={handleCreateCollection} className="w-full">
                Create Collection
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection) => (
          <Card key={collection.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getThemeColor(collection.theme)}`} />
                  <CardTitle className="text-lg">{collection.name}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Share className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:text-destructive"
                    onClick={() => handleDeleteCollection(collection.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-sm">
                {collection.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {collection.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {collection.items.length} items
                </div>
                <div className="flex items-center gap-1">
                  {collection.isPublic ? (
                    <><Share className="h-3 w-3" /> Public</>
                  ) : (
                    <><Heart className="h-3 w-3" /> Private</>
                  )}
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-1" />
                Add Items
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Empty State */}
        {collections.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Collections Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first collection to organize your anime and manga
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Collection
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};