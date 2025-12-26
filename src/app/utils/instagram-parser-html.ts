import JSZip from 'jszip';

export interface InstagramData {
  accountAge: { years: number; months: number } | null;
  topChatPartners: Array<{ name: string; count: number }>;
  likes: { total: number; topCreator: string | null; topCreatorCount: number };
  comments: { total: number; topCreator: string | null; topCreatorCount: number };
  avgResponseTime: { hours: number; minutes: number } | null;
  topSharedTo: Array<{ name: string; count: number }>;
  topReceivedFrom: Array<{ name: string; count: number }>;
  contentCreated: { posts: number; reels: number; stories: number };
  topics: Array<{ name: string; emoji: string }>;
}

/**
 * Identity - Represents the user whose data is being parsed
 */
interface Identity {
  username: string | null;
  name: string | null;
}

/**
 * Clean and decode HTML entities from text
 */
function cleanText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&#064;/g, '@')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get emoji for a topic based on keywords
 */
function getEmojiForTopic(topic: string): string {
  const t = topic.toLowerCase();
  
  // Sports
  if (t.includes('basketball')) return '🏀';
  if (t.includes('cricket')) return '🏏';
  if (t.includes('football') || t.includes('soccer')) return '⚽';
  if (t.includes('tennis')) return '🎾';
  if (t.includes('baseball')) return '⚾';
  if (t.includes('sport') || t.includes('fitness') || t.includes('gym')) return '💪';
  if (t.includes('boxing') || t.includes('combat') || t.includes('mma')) return '🥊';
  if (t.includes('swimming')) return '🏊';
  if (t.includes('running') || t.includes('marathon')) return '🏃';
  
  // Food & Drink
  if (t.includes('food') || t.includes('cuisine') || t.includes('recipe') || t.includes('cooking')) return '🍕';
  if (t.includes('coffee') || t.includes('café')) return '☕';
  if (t.includes('wine') || t.includes('cocktail') || t.includes('beer')) return '🍷';
  if (t.includes('dessert') || t.includes('cake') || t.includes('sweet')) return '🍰';
  if (t.includes('vegan') || t.includes('vegetarian') || t.includes('healthy eating')) return '🥗';
  
  // Travel & Places
  if (t.includes('travel') || t.includes('vacation') || t.includes('tourism')) return '✈️';
  if (t.includes('aviation') || t.includes('airline')) return '✈️';
  if (t.includes('asia') || t.includes('destination')) return '🌏';
  if (t.includes('beach') || t.includes('ocean')) return '🏖️';
  if (t.includes('mountain') || t.includes('hiking')) return '⛰️';
  if (t.includes('city') || t.includes('urban')) return '🏙️';
  
  // Entertainment
  if (t.includes('video game') || t.includes('gaming') || t.includes('esports')) return '🎮';
  if (t.includes('movie') || t.includes('film') || t.includes('cinema')) return '🎬';
  if (t.includes('tv') || t.includes('television') || t.includes('series')) return '📺';
  if (t.includes('bollywood') || t.includes('hollywood')) return '🎬';
  if (t.includes('anime') || t.includes('manga')) return '🎌';
  if (t.includes('music') || t.includes('concert') || t.includes('band')) return '🎵';
  if (t.includes('comedy') || t.includes('standup')) return '😂';
  
  // Creative & Arts
  if (t.includes('fashion') || t.includes('clothing') || t.includes('style')) return '👗';
  if (t.includes('art') || t.includes('paint') || t.includes('draw')) return '🎨';
  if (t.includes('photography') || t.includes('photo')) return '📷';
  if (t.includes('design') || t.includes('graphic')) return '🎨';
  if (t.includes('writing') || t.includes('literature') || t.includes('poetry')) return '✍️';
  if (t.includes('dance') || t.includes('ballet')) return '💃';
  
  // Technology
  if (t.includes('technology') || t.includes('tech') || t.includes('gadget')) return '💻';
  if (t.includes('coding') || t.includes('programming') || t.includes('software')) return '👨‍💻';
  if (t.includes('ai') || t.includes('artificial intelligence') || t.includes('machine learning')) return '🤖';
  if (t.includes('crypto') || t.includes('blockchain')) return '₿';
  
  // Lifestyle
  if (t.includes('pet') || t.includes('dog') || t.includes('cat')) return '🐾';
  if (t.includes('car') || t.includes('automotive')) return '🚗';
  if (t.includes('motorcycle') || t.includes('bike')) return '🏍️';
  if (t.includes('home') || t.includes('interior') || t.includes('decor')) return '🏠';
  if (t.includes('garden') || t.includes('plant')) return '🌱';
  
  // Education & Career
  if (t.includes('business') || t.includes('entrepreneur')) return '💼';
  if (t.includes('finance') || t.includes('invest')) return '💰';
  if (t.includes('science') || t.includes('research')) return '🔬';
  if (t.includes('education') || t.includes('learning')) return '📚';
  
  // Health & Wellness
  if (t.includes('yoga') || t.includes('meditation')) return '🧘';
  if (t.includes('wellness') || t.includes('mental health')) return '💚';
  
  return '🏷️';
}

/**
 * Parse HTML using browser's DOMParser
 */
function parseHTML(html: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

/**
 * Main parser function
 */
export async function parseInstagramData(file: File): Promise<InstagramData> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);

  // Initialize result
  const data: InstagramData = {
    accountAge: null,
    topChatPartners: [],
    likes: { total: 0, topCreator: null, topCreatorCount: 0 },
    comments: { total: 0, topCreator: null, topCreatorCount: 0 },
    avgResponseTime: null,
    topSharedTo: [],
    topReceivedFrom: [],
    contentCreated: { posts: 0, reels: 0, stories: 0 },
    topics: [],
  };

  /**
   * Helper to read HTML file from zip
   */
  async function readHTML(path: string): Promise<string | null> {
    try {
      const file = contents.file(path);
      if (!file) return null;
      return await file.async('string');
    } catch {
      return null;
    }
  }


  // ============================================================================
  // STEP 0: USER IDENTIFICATION (The "isMe" System)
  // ============================================================================
  const identity: Identity = { username: null, name: null };

  const personalInfoHTML = await readHTML('personal_information/personal_information/personal_information.html');
  
  if (personalInfoHTML) {
    const doc = parseHTML(personalInfoHTML);
    
    // Try to find Username and Name in table structure
    // Structure: <tr><td colspan="2">Username<div><div>dipanshudaga</div></div></td></tr>
    const rows = Array.from(doc.querySelectorAll('tr'));
    for (const row of rows) {
      const rowText = row.textContent || '';

      // Check if this row contains "Username" (exact match)
      if (rowText.includes('Username')) {
        const td = row.querySelector('td[colspan="2"]');
        if (td) {
          const divs = Array.from(td.querySelectorAll('div'));
          for (let i = divs.length - 1; i >= 0; i--) {
            const divText = cleanText(divs[i].textContent || '');
            if (divText && !divText.includes('Username') && divText.length > 0) {
              identity.username = divText;
              break;
            }
          }
        }
      }

      // Check if this row contains "Name" but NOT "Username" (to avoid confusion)
      if (rowText.includes('Name') && !rowText.includes('Username')) {
        const td = row.querySelector('td[colspan="2"]');
        if (td) {
          const divs = Array.from(td.querySelectorAll('div'));
          for (let i = divs.length - 1; i >= 0; i--) {
            const divText = cleanText(divs[i].textContent || '');
            if (divText && !divText.includes('Name') && divText.length > 0) {
              identity.name = divText;
              break;
            }
          }
        }
      }
    }
    
    // Regex fallback - try multiple patterns
    if (!identity.username) {
      const patterns = [
        /Username<\/td>[\s\S]*?<div><div>([^<]+)<\/div><\/div>/,
        /Username[^>]*>[\s\S]*?<div><div>([^<]+)<\/div><\/div>/,
        /Username<\/td>\s*<td[^>]*>(.*?)<\/td>/
      ];
      for (const pattern of patterns) {
        const match = personalInfoHTML.match(pattern);
        if (match) {
          identity.username = cleanText(match[1].replace(/<[^>]+>/g, ''));
          if (identity.username) break;
        }
      }
    }
    
    if (!identity.name) {
      const patterns = [
        /Name<\/td>[\s\S]*?<div><div>([^<]+)<\/div><\/div>/,
        /Name[^>]*>[\s\S]*?<div><div>([^<]+)<\/div><\/div>/
      ];
      for (const pattern of patterns) {
        const match = personalInfoHTML.match(pattern);
        if (match) {
          identity.name = cleanText(match[1].replace(/<[^>]+>/g, ''));
          if (identity.name) break;
        }
      }
    }
  }


  if (!identity.username && !identity.name) {
  }

  // Helper function to check if a name matches the user's identity
  const isSelf = (name: string): boolean => {
    if (!name || (!identity.username && !identity.name)) return false;
    const normalized = name.toLowerCase().trim();
    const normalizedUsername = identity.username?.toLowerCase().trim() || '';
    const normalizedName = identity.name?.toLowerCase().trim() || '';
    const nameWithoutAt = normalized.replace(/^@/, '');
    const usernameWithoutAt = normalizedUsername.replace(/^@/, '');
    
    return normalized === normalizedUsername || 
           normalized === normalizedName ||
           nameWithoutAt === normalizedUsername ||
           nameWithoutAt === usernameWithoutAt ||
           normalized === usernameWithoutAt;
  };

  // ============================================================================
  // METRIC 1: ACCOUNT AGE
  // ============================================================================
  const signupHTML = await readHTML('security_and_login_information/login_and_profile_creation/signup_details.html');
  
  if (signupHTML) {
    const doc = parseHTML(signupHTML);
    const rows = Array.from(doc.querySelectorAll('tr'));
    
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length >= 2) {
        const label = cleanText(cells[0].textContent || '');
        const value = cleanText(cells[1].textContent || '');
        
        if (label === 'Time' || label === 'Date') {
          try {
            const signupDate = new Date(value);
            const now = new Date();
            
            let years = now.getFullYear() - signupDate.getFullYear();
            let months = now.getMonth() - signupDate.getMonth();
            
            if (months < 0) {
              years--;
              months += 12;
            }
            
            data.accountAge = { years, months };
          } catch (e) {
          }
          break;
        }
      }
    }
  }

  // ============================================================================
  // METRIC 2: TOPICS/INTERESTS
  // ============================================================================
  const topicsHTML = await readHTML('preferences/your_topics/recommended_topics.html');
  
  if (topicsHTML) {
    const doc = parseHTML(topicsHTML);
    const topics: Set<string> = new Set();
    
    // Structure: <td>Name<div><div>Basketball</div></div></td>
    // Extract only from nested div > div, not the "Name" label
    const cells = Array.from(doc.querySelectorAll('td'));
    
    for (const cell of cells) {
      // Check if this cell has the nested div structure
      const nestedDiv = cell.querySelector('div > div');
      if (nestedDiv) {
        const topicName = cleanText(nestedDiv.textContent || '');
        // Skip if it's just "Name" or empty
        if (topicName && 
            topicName !== 'Name' && 
            topicName.length > 2 && 
            topicName.length < 100 &&
            !topicName.includes('http') &&
            !topicName.includes('class=')) {
          topics.add(topicName);
        }
      } else {
        // Fallback: check if it's a valid topic (not "Name" label)
        const text = cleanText(cell.textContent || '');
        if (text && 
            text !== 'Name' && 
            !text.toLowerCase().startsWith('name') &&
            text.length > 2 && 
            text.length < 100 &&
            !text.includes('http') &&
            !text.includes('class=')) {
          // Remove "name" prefix if present
          const cleaned = text.replace(/^name/i, '').trim();
          if (cleaned) {
            topics.add(cleaned);
          }
        }
      }
    }
    
    data.topics = Array.from(topics).map(name => ({
      name,
      emoji: getEmojiForTopic(name)
    }));
    
  }

  // ============================================================================
  // METRIC 3: CONTENT CREATED
  // ============================================================================
  
  // Count Posts - try both paths
  let totalPosts = 0;
  const mediaFolder = contents.folder('your_instagram_activity/media') || contents.folder('your_instagram_activity/content');
  
  if (mediaFolder) {
    const postFiles: string[] = [];
    mediaFolder.forEach((relativePath, file) => {
      if (relativePath.match(/posts_\d+\.html$/)) {
        postFiles.push(file.name);
      }
    });
    
    for (const postFile of postFiles) {
      const html = await readHTML(postFile);
      if (html) {
        const doc = parseHTML(html);
        const blocks = Array.from(doc.querySelectorAll('div.pam'));
        totalPosts += blocks.length;
      }
    }
  }
  
  // Count Stories - try both paths
  let storiesCount = 0;
  const storiesHTML = await readHTML('your_instagram_activity/media/stories.html') || 
                      await readHTML('your_instagram_activity/content/stories.html');
  if (storiesHTML) {
    const doc = parseHTML(storiesHTML);
    storiesCount = doc.querySelectorAll('div.pam').length;
  }
  
  // Count Reels - try both paths
  let reelsCount = 0;
  const reelsHTML = await readHTML('your_instagram_activity/media/reels.html') || 
                    await readHTML('your_instagram_activity/content/reels.html');
  if (reelsHTML) {
    const doc = parseHTML(reelsHTML);
    reelsCount = doc.querySelectorAll('div.pam').length;
  }
  
  data.contentCreated = { posts: totalPosts, reels: reelsCount, stories: storiesCount };

  // ============================================================================
  // METRIC 4: LIKES TRACKING
  // ============================================================================
  const likesHTML = await readHTML('your_instagram_activity/likes/liked_posts.html');
  
  if (likesHTML) {
    const doc = parseHTML(likesHTML);
    const blocks = Array.from(doc.querySelectorAll('div.pam'));
    
    data.likes.total = blocks.length;
    
    const creatorCounts: Record<string, number> = {};
    
    for (const block of blocks) {
      let mediaOwner: string | null = null;
      
      // Attempt 1: Get username from h2 tag (most common structure)
      const h2 = block.querySelector('h2');
      if (h2) {
        mediaOwner = cleanText(h2.textContent || '');
      }
      
      // Attempt 2: Structured - Look for "Media Owner" cell
      if (!mediaOwner) {
        const rows = Array.from(block.querySelectorAll('tr'));
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 2) {
            const label = cleanText(cells[0].textContent || '');
            if (label === 'Media Owner') {
              mediaOwner = cleanText(cells[1].textContent || '');
              break;
            }
          }
        }
      }
      
      // Attempt 3: Text pattern - "Liked X's"
      if (!mediaOwner) {
        const blockText = block.textContent || '';
        const match = blockText.match(/Liked\s+([^']+)'s/);
        if (match) {
          mediaOwner = cleanText(match[1]);
        }
      }
      
      // Attempt 4: First anchor tag
      if (!mediaOwner) {
        const anchor = block.querySelector('a');
        if (anchor) {
          const href = anchor.getAttribute('href') || '';
          // Extract username from Instagram URL
          const urlMatch = href.match(/instagram\.com\/([^\/\?]+)/);
          if (urlMatch) {
            mediaOwner = urlMatch[1];
          } else {
            mediaOwner = cleanText(anchor.textContent || '');
          }
        }
      }
      
      // Filter out self - normalize for comparison
      if (mediaOwner) {
        const normalizedOwner = mediaOwner.toLowerCase().trim();
        const normalizedUsername = identity.username?.toLowerCase().trim() || '';
        const normalizedName = identity.name?.toLowerCase().trim() || '';
        
        // Also check if it's just the username without @
        const ownerWithoutAt = normalizedOwner.replace(/^@/, '');
        const usernameWithoutAt = normalizedUsername.replace(/^@/, '');
        
        if (normalizedOwner !== normalizedUsername && 
            normalizedOwner !== normalizedName &&
            ownerWithoutAt !== normalizedUsername &&
            ownerWithoutAt !== usernameWithoutAt &&
            normalizedOwner !== usernameWithoutAt) {
          creatorCounts[mediaOwner] = (creatorCounts[mediaOwner] || 0) + 1;
        }
      }
    }
    
    const sortedCreators = Object.entries(creatorCounts)
      .sort((a, b) => b[1] - a[1]);
    
    if (sortedCreators.length > 0) {
      data.likes.topCreator = `@${sortedCreators[0][0]}`;
      data.likes.topCreatorCount = sortedCreators[0][1];
    }
    
  }

  // ============================================================================
  // METRIC 5: COMMENTS TRACKING
  // ============================================================================
  const commentFiles = ['post_comments_1.html', 'reels_comments.html'];
  const commentCreatorCounts: Record<string, number> = {};
  let totalComments = 0;
  let totalCommentsOnOthers = 0;

  for (const fileName of commentFiles) {
    const html = await readHTML(`your_instagram_activity/comments/${fileName}`);
    if (!html) continue;

    const doc = parseHTML(html);
    const blocks = Array.from(doc.querySelectorAll('div.pam'));

    for (const block of blocks) {
      let mediaOwner: string | null = null;

      // Look for "Media Owner" row - structure: <tr><td colspan="2">Media Owner<div><div>username</div></div></td></tr>
      const rows = Array.from(block.querySelectorAll('tr'));
      for (const row of rows) {
        // Get all text content to check if this row contains "Media Owner"
        const rowText = row.textContent || '';

        // Check if this row is the Media Owner row
        if (rowText.includes('Media Owner')) {
          // Find the td with colspan="2" that contains "Media Owner"
          const td = row.querySelector('td[colspan="2"]');
          if (td) {
            // The structure is: <td>Media Owner<div><div>USERNAME</div></div></td>
            // We need to get the innermost div text
            const divs = Array.from(td.querySelectorAll('div'));
            // The innermost div should contain just the username
            for (let i = divs.length - 1; i >= 0; i--) {
              const divText = cleanText(divs[i].textContent || '');
              // Skip if it contains "Media Owner" text or is empty
              if (divText && !divText.includes('Media Owner') && divText.length > 0) {
                mediaOwner = divText;
                break;
              }
            }
          }
          break;
        }
      }

      // Count all media owners to find top creator
      if (mediaOwner) {
        const normalizedOwner = mediaOwner.toLowerCase().trim();
        const normalizedUsername = identity.username?.toLowerCase().trim() || '';
        const normalizedName = identity.name?.toLowerCase().trim() || '';

        // Debug first comment (removed)

        // Also check if it's just the username without @
        const ownerWithoutAt = normalizedOwner.replace(/^@/, '');
        const usernameWithoutAt = normalizedUsername.replace(/^@/, '');

        const isSelfComment = normalizedOwner === normalizedUsername ||
            normalizedOwner === normalizedName ||
            ownerWithoutAt === normalizedUsername ||
            ownerWithoutAt === usernameWithoutAt ||
            normalizedOwner === usernameWithoutAt;

        if (!isSelfComment) {
          // Count comments on other people's posts
          totalCommentsOnOthers++;
          commentCreatorCounts[mediaOwner] = (commentCreatorCounts[mediaOwner] || 0) + 1;
          // Debug: log first few non-self comments
          if (totalCommentsOnOthers <= 3) {
          }
        } else {
          // Debug: log first few self-comments
          if (totalComments - totalCommentsOnOthers < 3) {
          }
        }
      }
    }

    // Total includes all comments
    totalComments += blocks.length;
  }
  
  const sortedCommentCreators = Object.entries(commentCreatorCounts)
    .sort((a, b) => b[1] - a[1]);


  if (sortedCommentCreators.length > 0) {
    const topCount = sortedCommentCreators[0][1];
    // Find all creators with the same top count (handles ties)
    const topCreators = sortedCommentCreators
      .filter(([_, count]) => count === topCount)
      .map(([name]) => name);

    // Join them with commas and "and" for the last one
    if (topCreators.length === 1) {
      data.comments.topCreator = `@${topCreators[0]}`;
    } else if (topCreators.length === 2) {
      data.comments.topCreator = `@${topCreators[0]} & @${topCreators[1]}`;
    } else {
      const lastCreator = topCreators[topCreators.length - 1];
      const otherCreators = topCreators.slice(0, -1).map(name => `@${name}`).join(', ');
      data.comments.topCreator = `${otherCreators} & @${lastCreator}`;
    }

    data.comments.topCreatorCount = topCount;
  } else {
  }

  // Use totalCommentsOnOthers instead of totalComments (exclude self-comments)
  data.comments.total = totalCommentsOnOthers;

  // ============================================================================
  // METRICS 6-9: MESSAGE ANALYSIS
  // ============================================================================
  const inboxFolder = contents.folder('your_instagram_activity/messages/inbox');
  
  if (inboxFolder) {
    const chatMessageCounts: Record<string, number> = {};
    const outboundShares: Record<string, number> = {};
    const inboundShares: Record<string, number> = {};
    const responseTimes: number[] = [];
    
    // Get all chat folders
    const chatFolders = new Set<string>();
    inboxFolder.forEach((path) => {
      const folder = path.split('/')[0];
      if (folder) chatFolders.add(folder);
    });
    
    
    for (const chatFolder of Array.from(chatFolders)) {
      // Find message files
      const msgFiles: string[] = [];
      inboxFolder.forEach((path, file) => {
        if (path.startsWith(chatFolder + '/') && path.match(/message_\d+\.html$/)) {
          msgFiles.push(file.name);
        }
      });
      
      if (msgFiles.length === 0) continue;
      
      const messages: Array<{
        sender: string;
        timestamp: Date | null;
        isShare: boolean;
        shouldCount: boolean; // For slide 2: exclude reactions/likes
      }> = [];
      
      const participants = new Set<string>();
      
      // Helper function to determine if a message should be counted (exclude reactions/likes)
      const shouldCountMessage = (blockText: string): boolean => {
        const lower = blockText.toLowerCase();
        return !lower.includes('reacted to your msg') && 
               !lower.includes('liked a message') &&
               !lower.includes('reacted to a message');
      };
      
      // Read all message files for this chat (sorted)
      for (const msgFile of msgFiles.sort()) {
        const html = await readHTML(msgFile);
        if (!html) continue;
        
        const doc = parseHTML(html);
        const blocks = Array.from(doc.querySelectorAll('div.pam'));
        
        for (const block of blocks) {
          // Extract sender from header
          const header = block.querySelector('h2');
          if (!header) continue;
          
          const sender = cleanText(header.textContent || '');
          if (!sender) continue;
          
          participants.add(sender);
          
          // Get block text for filtering
          const blockText = cleanText(block.textContent || '');
          const blockTextLower = blockText.toLowerCase();
          
          // Check if this message should be counted (exclude reactions/likes)
          const shouldCount = shouldCountMessage(blockText);
          
          // Extract timestamp - the structure is: <div class="_3-94 _a6-o">Dec 11, 2025 11:59 pm</div>
          let timestamp: Date | null = null;
          
          // Try multiple timestamp selectors
          const timestampSelectors = [
            'div._3-94._a6-o',
            'div._a6-o',
            'div[class*="_a6-o"]',
            'div[class*="timestamp"]',
            'div[class*="date"]'
          ];
          
          for (const selector of timestampSelectors) {
            const timestampDiv = block.querySelector(selector);
            if (timestampDiv) {
              try {
                const timeText = cleanText(timestampDiv.textContent || '');
                if (timeText) {
                  // Try parsing the date - format like "Dec 11, 2025 11:59 pm"
                  timestamp = new Date(timeText);
                  // Validate the date
                  if (!isNaN(timestamp.getTime()) && timestamp.getFullYear() > 2000) {
                    break;
                  }
                }
              } catch {}
            }
          }
          
          // Fallback: try to find any date-like text in the block
          if (!timestamp) {
            // Try to match common date patterns
            const datePatterns = [
              /(\w{3}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[APap][Mm])/,
              /(\w{3}\s+\d{1,2},\s+\d{4}\s+\d{1,2}:\d{2}\s+[APap][Mm])/,
              /(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[APap][Mm])/,
              /(\w{3}\s+\d{1,2},\s+\d{4})/,
            ];
            
            for (const pattern of datePatterns) {
              const match = blockText.match(pattern);
              if (match) {
                try {
                  timestamp = new Date(match[1]);
                  if (!isNaN(timestamp.getTime()) && timestamp.getFullYear() > 2000) {
                    break;
                  }
                } catch {}
              }
            }
          }
          
          // Check if message is a share
          const blockHTML = block.innerHTML;
          
          const isShare = (
            blockHTML.includes('instagram.com/reel/') ||
            blockHTML.includes('instagram.com/p/') ||
            blockHTML.includes('instagram.com/stories/') ||
            blockTextLower.includes('sent an attachment') ||
            blockTextLower.includes('shared a video') ||
            blockTextLower.includes('shared a post')
          ) && !(
            blockTextLower.includes('liked a message') ||
            blockTextLower.includes('reacted to a message')
          );
          
          messages.push({ sender, timestamp, isShare, shouldCount });
        }
      }
      
      // Determine if group chat
      const isGroup = participants.size > 2;
      
      // Get chat name
      // For groups: use chatFolder name (e.g., "krtikakritika_452806232808542")
      // For individuals: use first non-self participant
      const others = Array.from(participants).filter(p => !isSelf(p));
      const chatName = isGroup ? chatFolder.split('_')[0] : (others[0] || chatFolder.split('_')[0]);
      
      // METRIC 6: Top Chat Partners (ONLY individual chats, exclude groups)
      if (chatName && !isGroup) {
        // Count ALL messages from OTHER participants (texts, reels, posts, attachments, everything)
        // EXCLUDE: reactions and likes
        const otherMessages = messages.filter(msg =>
          !isSelf(msg.sender) && msg.shouldCount
        );
        if (otherMessages.length > 0) {
          chatMessageCounts[chatName] = (chatMessageCounts[chatName] || 0) + otherMessages.length;
        }
      }
      
      // METRIC 7 & 8: Shares
      for (const msg of messages) {
        if (msg.isShare && msg.shouldCount) {
          // Outbound (you sent)
          if (isSelf(msg.sender)) {
            if (chatName) {
              // Include groups for outbound shares
              outboundShares[chatName] = (outboundShares[chatName] || 0) + 1;
            }
          }
          // Inbound (others sent) - exclude self
          else if (!isSelf(msg.sender)) {
            // For groups: count as single entity using chatName
            // For individuals: count by sender name
            const shareKey = isGroup ? chatName : msg.sender;
            inboundShares[shareKey] = (inboundShares[shareKey] || 0) + 1;
          }
        }
      }
      
      // METRIC 9: Response Time (exclude group chats)
      if (!isGroup) {
        for (let i = 0; i < messages.length - 1; i++) {
          const curr = messages[i];
          const next = messages[i + 1];
          
          // Check for reply pattern: someone else -> you
          const isReplyPattern = !isSelf(curr.sender) && isSelf(next.sender);
          
          if (isReplyPattern && curr.timestamp && next.timestamp) {
            const deltaSeconds = (next.timestamp.getTime() - curr.timestamp.getTime()) / 1000;
            
            // Filter: positive delta and < 24 hours
            if (deltaSeconds > 0 && deltaSeconds < 86400) {
              responseTimes.push(deltaSeconds);
            }
          }
        }
      }
    }
    
    // METRIC 6: Top Chat Partners
    data.topChatPartners = Object.entries(chatMessageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    
    // METRIC 7: Top Shared To
    data.topSharedTo = Object.entries(outboundShares)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    
    // METRIC 8: Top Received From
    data.topReceivedFrom = Object.entries(inboundShares)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    
    // METRIC 9: Average Response Time
    if (responseTimes.length > 0) {
      const avgSeconds = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      data.avgResponseTime = {
        hours: Math.floor(avgSeconds / 3600),
        minutes: Math.floor((avgSeconds % 3600) / 60)
      };
      
    } else {
    }
  }

  return data;
}
