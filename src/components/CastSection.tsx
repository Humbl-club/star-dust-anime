import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, ChevronUp, Users, Award } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

interface CastSectionProps {
  cast: CastMember[];
  crew: CrewMember[];
  className?: string;
}

export const CastSection = ({ cast, crew, className = "" }: CastSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!cast.length && !crew.length) {
    return null;
  }

  const displayCast = isExpanded ? cast : cast.slice(0, 6);
  const keyCrewMembers = crew.filter(member => 
    ['Director', 'Producer', 'Executive Producer', 'Writer', 'Screenplay', 'Creator'].includes(member.job)
  );

  const getProfileUrl = (path: string | null) => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className={`border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Cast & Crew
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Key Crew Members */}
        {keyCrewMembers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold text-sm">Key Staff</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {keyCrewMembers.slice(0, 4).map((member) => (
                <div key={`crew-${member.id}-${member.job}`} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Avatar className="w-10 h-10">
                    <AvatarImage 
                      src={getProfileUrl(member.profile_path)} 
                      alt={member.name}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {member.job}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cast Members */}
        {cast.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">Voice Cast</h4>
                {cast.length > 6 && (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Show All ({cast.length})
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {displayCast.map((member) => (
                  <div key={`cast-${member.id}-${member.order}`} className="text-center space-y-2">
                    <Avatar className="w-16 h-16 mx-auto">
                      <AvatarImage 
                        src={getProfileUrl(member.profile_path)} 
                        alt={member.name}
                      />
                      <AvatarFallback>
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="space-y-1">
                      <p className="font-medium text-sm truncate" title={member.name}>
                        {member.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate" title={member.character}>
                        {member.character}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <CollapsibleContent>
                {cast.length > 6 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                    {cast.slice(6).map((member) => (
                      <div key={`cast-expanded-${member.id}-${member.order}`} className="text-center space-y-2">
                        <Avatar className="w-16 h-16 mx-auto">
                          <AvatarImage 
                            src={getProfileUrl(member.profile_path)} 
                            alt={member.name}
                          />
                          <AvatarFallback>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1">
                          <p className="font-medium text-sm truncate" title={member.name}>
                            {member.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" title={member.character}>
                            {member.character}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};