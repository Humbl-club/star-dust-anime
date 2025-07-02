import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Mic, Star } from "lucide-react";

interface Character {
  id: number;
  role: string;
  node: {
    id: number;
    name: {
      full: string;
      native?: string;
    };
    image: {
      large: string;
      medium: string;
    };
    description?: string;
  };
  voiceActors: Array<{
    id: number;
    name: {
      full: string;
      native?: string;
    };
    language: string;
    image: {
      large: string;
      medium: string;
    };
  }>;
}

interface CharacterSectionProps {
  characters: Character[];
  colorTheme?: string;
}

export const CharacterSection = ({ characters, colorTheme }: CharacterSectionProps) => {
  if (!characters?.length) return null;

  const mainCharacters = characters.filter(char => char.role === 'MAIN').slice(0, 6);
  const supportingCharacters = characters.filter(char => char.role === 'SUPPORTING').slice(0, 6);

  const CharacterCard = ({ character, index }: { character: Character; index: number }) => (
    <Card 
      className="overflow-hidden border-border/30 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 group cursor-pointer animate-fade-in hover:scale-[1.02]"
      style={{ 
        animationDelay: `${0.1 + (index * 0.05)}s`,
        borderColor: colorTheme ? `${colorTheme}20` : undefined
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Character Image */}
          <div className="relative">
            <Avatar className="w-16 h-16 ring-2 ring-border/30 group-hover:ring-primary/30 transition-all">
              <AvatarImage 
                src={character.node.image.large} 
                alt={character.node.name.full}
                className="object-cover"
              />
              <AvatarFallback>{character.node.name.full.charAt(0)}</AvatarFallback>
            </Avatar>
            <Badge 
              variant="secondary" 
              className="absolute -bottom-1 -right-1 text-xs px-1 py-0"
              style={{ backgroundColor: colorTheme ? `${colorTheme}20` : undefined }}
            >
              {character.role === 'MAIN' ? 'Main' : 'Support'}
            </Badge>
          </div>

          {/* Character Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {character.node.name.full}
            </h4>
            {character.node.name.native && (
              <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                {character.node.name.native}
              </p>
            )}

            {/* Voice Actor */}
            {character.voiceActors?.[0] && (
              <div className="flex items-center gap-2 mt-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage 
                    src={character.voiceActors[0].image.medium} 
                    alt={character.voiceActors[0].name.full}
                  />
                  <AvatarFallback className="text-xs">
                    {character.voiceActors[0].name.full.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium line-clamp-1">
                    {character.voiceActors[0].name.full}
                  </p>
                  <div className="flex items-center gap-1">
                    <Mic className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {character.voiceActors[0].language}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-fade-in">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Characters & Voice Actors
          </h3>
          <Badge variant="outline" className="text-sm">
            {characters.length} characters
          </Badge>
        </div>

        {/* Main Characters */}
        {mainCharacters.length > 0 && (
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Main Characters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mainCharacters.map((character, index) => (
                <CharacterCard 
                  key={character.node.id} 
                  character={character} 
                  index={index}
                />
              ))}
            </div>
          </div>
        )}

        {/* Supporting Characters */}
        {supportingCharacters.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-secondary" />
              Supporting Characters
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supportingCharacters.map((character, index) => (
                <CharacterCard 
                  key={character.node.id} 
                  character={character} 
                  index={index + mainCharacters.length}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};