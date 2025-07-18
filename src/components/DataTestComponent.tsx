
import { useSimpleNewApiData } from "@/hooks/useSimpleNewApiData";

export const DataTestComponent = () => {
  const { data: animeData, loading: animeLoading } = useSimpleNewApiData({ 
    contentType: 'anime',
    limit: 10
  });

  const { data: mangaData, loading: mangaLoading } = useSimpleNewApiData({ 
    contentType: 'manga',
    limit: 10
  });

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Anime Data Test</h2>
        {animeLoading ? (
          <p>Loading anime...</p>
        ) : (
          <div>
            <p>Found {animeData.length} anime</p>
            {animeData.slice(0, 5).map(anime => (
              <div key={anime.id} className="border p-2 mb-2">
                <h3 className="font-semibold">{anime.title}</h3>
                <p>Episodes: {anime.episodes}</p>
                <p>Score: {anime.score}</p>
                <p>Status: {anime.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Manga Data Test</h2>
        {mangaLoading ? (
          <p>Loading manga...</p>
        ) : (
          <div>
            <p>Found {mangaData.length} manga</p>
            {mangaData.slice(0, 5).map(manga => (
              <div key={manga.id} className="border p-2 mb-2">
                <h3 className="font-semibold">{manga.title}</h3>
                <p>Chapters: {manga.chapters}</p>
                <p>Score: {manga.score}</p>
                <p>Status: {manga.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
