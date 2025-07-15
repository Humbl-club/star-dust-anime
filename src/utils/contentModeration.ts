import { Filter } from 'bad-words';

// Initialize the bad words filter
const filter = new Filter();

// Optional: Add custom words or remove false positives
// filter.addWords(['customword1', 'customword2']);
// filter.removeWords(['word1', 'word2']);

/**
 * Filters content for offensive language
 * @param content - The text content to filter
 * @returns The filtered content with offensive words replaced
 */
export const filterContent = (content: string): string => {
  if (!content) return content;
  
  try {
    return filter.clean(content);
  } catch (error) {
    console.error('Error filtering content:', error);
    return content; // Return original content if filtering fails
  }
};

/**
 * Checks if content contains offensive language
 * @param content - The text content to check
 * @returns True if content contains offensive words, false otherwise
 */
export const containsOffensiveContent = (content: string): boolean => {
  if (!content) return false;
  
  try {
    return filter.isProfane(content);
  } catch (error) {
    console.error('Error checking content:', error);
    return false; // Return false if checking fails
  }
};