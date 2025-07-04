import { format, addDays, differenceInSeconds, parseISO, isValid } from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';

interface CountdownData {
  id: string;
  title: string;
  type: 'anime' | 'manga';
  releaseDate: Date;
  episodeNumber?: number;
  chapterNumber?: number;
  status: 'upcoming' | 'live' | 'finished';
  timeZone?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isLive: boolean;
  hasEnded: boolean;
}

class CountdownService {
  private userTimeZone: string;
  private countdowns: Map<string, CountdownData> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Set user's preferred timezone
  setUserTimeZone(timeZone: string) {
    this.userTimeZone = timeZone;
  }

  // Calculate time remaining until a specific date
  calculateTimeRemaining(targetDate: Date): TimeRemaining {
    const now = new Date();
    const diffInSeconds = differenceInSeconds(targetDate, now);

    if (diffInSeconds <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        totalSeconds: 0,
        isLive: diffInSeconds > -3600, // Live for 1 hour after release
        hasEnded: diffInSeconds <= -3600
      };
    }

    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;

    return {
      days,
      hours,
      minutes,
      seconds,
      totalSeconds: diffInSeconds,
      isLive: false,
      hasEnded: false
    };
  }

  // Format countdown display
  formatCountdown(timeRemaining: TimeRemaining): string {
    const { days, hours, minutes, seconds, isLive, hasEnded } = timeRemaining;

    if (hasEnded) return 'Released';
    if (isLive) return 'Live Now!';

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Get relative time description
  getRelativeDescription(timeRemaining: TimeRemaining): string {
    const { days, hours, minutes, isLive, hasEnded } = timeRemaining;

    if (hasEnded) return 'Already released';
    if (isLive) return 'Available now!';

    if (days > 7) return 'More than a week';
    if (days > 1) return `In ${days} days`;
    if (days === 1) return 'Tomorrow';
    if (hours > 1) return `In ${hours} hours`;
    if (hours === 1) return 'In about an hour';
    if (minutes > 5) return `In ${minutes} minutes`;
    if (minutes > 0) return 'Very soon';
    return 'Any moment now!';
  }

  // Parse various date formats from anime/manga APIs
  parseReleaseDate(dateString: string | null, timeZone = 'UTC'): Date | null {
    if (!dateString) return null;

    try {
      // Handle various formats
      let date: Date;

      if (dateString.includes('T') || dateString.includes('Z')) {
        // ISO format
        date = parseISO(dateString);
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        date = parseISO(`${dateString}T00:00:00`);
      } else if (dateString.match(/^\d{10}$/)) {
        // Unix timestamp (seconds)
        date = new Date(parseInt(dateString) * 1000);
      } else if (dateString.match(/^\d{13}$/)) {
        // Unix timestamp (milliseconds)
        date = new Date(parseInt(dateString));
      } else {
        // Try to parse as is
        date = new Date(dateString);
      }

      if (!isValid(date)) return null;

      // Convert to user's timezone if needed
      if (timeZone !== 'UTC') {
        date = fromZonedTime(date, timeZone);
      }

      return date;
    } catch (error) {
      console.error('Failed to parse date:', dateString, error);
      return null;
    }
  }

  // Generate countdown for anime episode
  createAnimeCountdown(anime: any): CountdownData | null {
    const releaseDate = this.parseReleaseDate(
      anime.next_episode_date || anime.aired_to,
      anime.timezone || 'Asia/Tokyo' // Default to JST for anime
    );

    if (!releaseDate) return null;

    return {
      id: `anime-${anime.id}`,
      title: anime.title_english || anime.title,
      type: 'anime',
      releaseDate,
      episodeNumber: anime.next_episode_number || anime.episodes,
      status: this.getCountdownStatus(releaseDate),
      timeZone: anime.timezone || 'Asia/Tokyo'
    };
  }

  // Generate countdown for manga chapter
  createMangaCountdown(manga: any): CountdownData | null {
    const releaseDate = this.parseReleaseDate(
      manga.next_chapter_date || manga.published_to,
      manga.timezone || 'Asia/Tokyo' // Default to JST for manga
    );

    if (!releaseDate) return null;

    return {
      id: `manga-${manga.id}`,
      title: manga.title_english || manga.title,
      type: 'manga',
      releaseDate,
      chapterNumber: manga.next_chapter_number || manga.chapters,
      status: this.getCountdownStatus(releaseDate),
      timeZone: manga.timezone || 'Asia/Tokyo'
    };
  }

  // Get countdown status
  private getCountdownStatus(releaseDate: Date): 'upcoming' | 'live' | 'finished' {
    const now = new Date();
    const diffInSeconds = differenceInSeconds(releaseDate, now);

    if (diffInSeconds > 0) return 'upcoming';
    if (diffInSeconds > -3600) return 'live'; // Live for 1 hour
    return 'finished';
  }

  // Register countdown with automatic updates
  registerCountdown(countdown: CountdownData, callback: (timeRemaining: TimeRemaining) => void) {
    // Clear existing interval
    const existingInterval = this.intervals.get(countdown.id);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Store countdown
    this.countdowns.set(countdown.id, countdown);

    // Set up interval for updates
    const interval = setInterval(() => {
      const timeRemaining = this.calculateTimeRemaining(countdown.releaseDate);
      callback(timeRemaining);

      // Clean up if countdown is finished
      if (timeRemaining.hasEnded) {
        this.unregisterCountdown(countdown.id);
      }
    }, 1000);

    this.intervals.set(countdown.id, interval);

    // Initial callback
    const initialTime = this.calculateTimeRemaining(countdown.releaseDate);
    callback(initialTime);
  }

  // Unregister countdown
  unregisterCountdown(countdownId: string) {
    const interval = this.intervals.get(countdownId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(countdownId);
    }
    this.countdowns.delete(countdownId);
  }

  // Get all active countdowns
  getActiveCountdowns(): CountdownData[] {
    return Array.from(this.countdowns.values())
      .filter(countdown => countdown.status !== 'finished')
      .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());
  }

  // Format date in user's timezone
  formatInUserTimeZone(date: Date, formatString = 'PPP p'): string {
    return formatInTimeZone(date, this.userTimeZone, formatString);
  }

  // Get timezone offset string
  getTimeZoneOffset(date: Date = new Date()): string {
    const offset = date.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Clean up all intervals
  cleanup() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.countdowns.clear();
  }

  // Generate notification message
  generateNotificationMessage(countdown: CountdownData, timeRemaining: TimeRemaining): string {
    const { title, type, episodeNumber, chapterNumber } = countdown;
    const relativeTime = this.getRelativeDescription(timeRemaining);

    if (timeRemaining.isLive) {
      return `${title} ${type === 'anime' ? `Episode ${episodeNumber}` : `Chapter ${chapterNumber}`} is now available!`;
    }

    if (timeRemaining.totalSeconds <= 300) { // 5 minutes
      return `${title} ${type === 'anime' ? `Episode ${episodeNumber}` : `Chapter ${chapterNumber}`} releases in ${this.formatCountdown(timeRemaining)}!`;
    }

    return `${title} ${type === 'anime' ? `Episode ${episodeNumber}` : `Chapter ${chapterNumber}`} releases ${relativeTime}`;
  }
}

export const countdownService = new CountdownService();
export type { CountdownData, TimeRemaining };