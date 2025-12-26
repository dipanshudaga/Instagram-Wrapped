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

function extractText(html: string): string {
  let text = html.replace(/<[^>]+>/g, '');
  text = text.replace(/&amp;/g, '&').replace(/&#064;/g, '@').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#039;/g, "'");
  return text.trim();
}

function getEmojiForTopic(topic: string): string {
  const t = topic.toLowerCase();
  if (t.includes('basketball')) return '🏀';
  if (t.includes('cricket')) return '🏏';
  if (t.includes('sport') || t.includes('combat')) return '⚽';
  if (t.includes('food') || t.includes('cuisine') || t.includes('recipe')) return '🍕';
  if (t.includes('drink') || t.includes('coffee') || t.includes('beverage')) return '☕';
  if (t.includes('travel') || t.includes('aviation') || t.includes('vacation')) return '✈️';
  if (t.includes('asia') || t.includes('destination')) return '🌏';
  if (t.includes('video game') || t.includes('game')) return '🎮';
  if (t.includes('movie') || t.includes('tv') || t.includes('bollywood') || t.includes('anime')) return '🎬';
  if (t.includes('music')) return '🎵';
  if (t.includes('fashion') || t.includes('clothing')) return '👗';
  if (t.includes('art') || t.includes('paint') || t.includes('draw')) return '🎨';
  if (t.includes('technology') || t.includes('tech')) return '💻';
  return '🏷️';
}

export async function parseInstagramData(file: File): Promise<InstagramData> {
  const zip = new JSZip();
  const contents = await zip.loadAsync(file);

  let username: string | null = null;
  
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

  async function readHTML(path: string): Promise<string | null> {
    try {
      const file = contents.file(path);
      if (!file) return null;
      return await file.async('string');
    } catch (e) {
      return null;
    }
  }

  console.log('🚀 Starting parsing...');

  // 1. GET USERNAME - MULTIPLE ATTEMPTS
  const usernamePaths = [
    'personal_information/personal_information/personal_information.html',
    'security_and_login_information/login_and_profile_creation/signup_details.html'
  ];

  for (const path of usernamePaths) {
    const html = await readHTML(path);
    if (html) {
      // Try multiple patterns
      const patterns = [
        /Username<\/td><td[^>]*><div><div>([^<]+)<\/div>/,
        /<td[^>]*>Username<\/td><td[^>]*>([^<]+)<\/td>/,
        /Username.*?<div>([^<]+)<\/div>/
      ];
      
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          username = extractText(match[1]).replace(/\s+/g, '');
          if (username) {
            console.log('✅ Username:', username);
            break;
          }
        }
      }
      if (username) break;
    }
  }

  if (!username) {
    console.error('❌ Could not detect username');
  }

  // 2. ACCOUNT AGE
  const signupHTML = await readHTML('security_and_login_information/login_and_profile_creation/signup_details.html');
  if (signupHTML) {
    const patterns = [
      /Time<\/td><td[^>]*>([^<]+)<\/td>/,
      /<td[^>]*>Time<\/td><td[^>]*>([^<]+)<\/td>/
    ];
    
    for (const pattern of patterns) {
      const match = signupHTML.match(pattern);
      if (match) {
        try {
          const signupDate = new Date(extractText(match[1]));
          const now = new Date();
          let years = now.getFullYear() - signupDate.getFullYear();
          let months = now.getMonth() - signupDate.getMonth();
          if (months < 0) {
            years--;
            months += 12;
          }
          data.accountAge = { years, months };
          console.log(`📅 ${years}y ${months}m`);
        } catch (e) {}
        break;
      }
    }
  }

  // 3. TOPICS  
  const topicsHTML = await readHTML('preferences/your_topics/recommended_topics.html');
  if (topicsHTML) {
    const patterns = [
      /Name<\/td><td[^>]*><div><div>([^<]+)<\/div>/g,
      /<td[^>]*>Name<\/td><td[^>]*>([^<]+)<\/td>/g
    ];
    
    for (const pattern of patterns) {
      const matches = [...topicsHTML.matchAll(pattern)];
      if (matches.length > 0) {
        data.topics = matches.slice(0, 30).map(m => {
          const name = extractText(m[1]);
          return { name, emoji: getEmojiForTopic(name) };
        });
        console.log(`🏷️  ${data.topics.length} topics`);
        break;
      }
    }
  }

  // 4. CONTENT
  let posts = 0;
  const mediaFolder = contents.folder('your_instagram_activity/media');
  if (mediaFolder) {
    const postFiles: string[] = [];
    mediaFolder.forEach((relativePath, file) => {
      if (relativePath.match(/posts_\d+\.html$/)) {
        postFiles.push(file.name);
      }
    });
    
    for (const file of postFiles) {
      const html = await readHTML(file);
      if (html) {
        const blocks = html.match(/<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder">/g);
        if (blocks) posts += blocks.length;
      }
    }
  }
  
  const reelsHTML = await readHTML('your_instagram_activity/media/reels.html');
  const reels = reelsHTML ? (reelsHTML.match(/<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder">/g) || []).length : 0;
  
  const storiesHTML = await readHTML('your_instagram_activity/media/stories.html');
  const stories = storiesHTML ? (storiesHTML.match(/<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder">/g) || []).length : 0;
  
  data.contentCreated = { posts, reels, stories };
  console.log(`📸 ${posts}p ${reels}r ${stories}s`);

  // 5. LIKES
  const likesHTML = await readHTML('your_instagram_activity/likes/liked_posts.html');
  if (likesHTML) {
    const total = (likesHTML.match(/<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder">/g) || []).length;
    
    const patterns = [
      /Media Owner<\/td><td[^>]*><div><div>([^<]+)<\/div>/g,
      /<td[^>]*>Media Owner<\/td><td[^>]*>([^<]+)<\/td>/g
    ];
    
    const counts: Record<string, number> = {};
    for (const pattern of patterns) {
      const matches = [...likesHTML.matchAll(pattern)];
      if (matches.length > 0) {
        for (const m of matches) {
          const creator = extractText(m[1]);
          if (creator && creator !== username) {
            counts[creator] = (counts[creator] || 0) + 1;
          }
        }
        break;
      }
    }
    
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    data.likes = {
      total,
      topCreator: sorted[0] ? `@${sorted[0][0]}` : null,
      topCreatorCount: sorted[0] ? sorted[0][1] : 0
    };
    console.log(`❤️  ${total} likes | Top: ${data.likes.topCreator}`);
  }

  // 6. COMMENTS
  let totalComments = 0;
  const commentCounts: Record<string, number> = {};
  
  for (const fileName of ['post_comments_1.html', 'reels_comments.html']) {
    const html = await readHTML(`your_instagram_activity/comments/${fileName}`);
    if (html) {
      const blocks = html.match(/<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder">/g);
      if (blocks) totalComments += blocks.length;
      
      const patterns = [
        /Media Owner<\/td><td[^>]*><div><div>([^<]+)<\/div>/g,
        /<td[^>]*>Media Owner<\/td><td[^>]*>([^<]+)<\/td>/g
      ];
      
      for (const pattern of patterns) {
        const matches = [...html.matchAll(pattern)];
        if (matches.length > 0) {
          for (const m of matches) {
            const creator = extractText(m[1]);
            if (creator && creator !== username) {
              commentCounts[creator] = (commentCounts[creator] || 0) + 1;
            }
          }
          break;
        }
      }
    }
  }
  
  const sortedComments = Object.entries(commentCounts).sort((a, b) => b[1] - a[1]);
  data.comments = {
    total: totalComments,
    topCreator: sortedComments[0] ? `@${sortedComments[0][0]}` : null,
    topCreatorCount: sortedComments[0] ? sortedComments[0][1] : 0
  };
  console.log(`💬 ${totalComments} comments | Top: ${data.comments.topCreator}`);

  // 7. MESSAGES
  const inboxFolder = contents.folder('your_instagram_activity/messages/inbox');
  if (inboxFolder) {
    const chatCounts: Record<string, number> = {};
    const sharedTo: Record<string, number> = {};
    const receivedFrom: Record<string, number> = {};
    const responseTimes: number[] = [];
    
    const chatFolders: string[] = [];
    inboxFolder.forEach((path) => {
      const folder = path.split('/')[0];
      if (folder && !chatFolders.includes(folder)) {
        chatFolders.push(folder);
      }
    });
    
    console.log(`💬 ${chatFolders.length} chats`);
    
    for (const chatFolder of chatFolders) {
      const msgFiles: string[] = [];
      inboxFolder.forEach((path, file) => {
        if (path.startsWith(chatFolder + '/') && path.match(/message_\d+\.html$/)) {
          msgFiles.push(file.name);
        }
      });
      
      if (msgFiles.length === 0) continue;
      
      const messages: any[] = [];
      const participants = new Set<string>();
      
      for (const msgFile of msgFiles.sort()) {
        const html = await readHTML(msgFile);
        if (!html) continue;
        
        const blockPattern = /<div class="pam _3-95 _2ph- _a6-g uiBoxWhite noborder">(.*?)<\/div>\s*<div class="_3-94 _a6-o">([^<]+)<\/div>/gs;
        for (const [_, block, timestamp] of html.matchAll(blockPattern)) {
          const senderMatch = block.match(/<h2[^>]*>([^<]+)<\/h2>/);
          if (!senderMatch) continue;
          
          const sender = extractText(senderMatch[1]);
          participants.add(sender);
          
          const text = extractText(block);
          if (text.includes('Liked a message')) continue;
          
          let time: Date | null = null;
          try {
            time = new Date(extractText(timestamp));
          } catch {}
          
          const isShared = text.includes('sent an attachment') || 
                          block.includes('/reel/') || 
                          block.includes('/p/') ||
                          block.includes('<img src=');
          
          messages.push({ sender, text, time, isShared });
        }
      }
      
      const isGroup = participants.size > 2;
      const others = Array.from(participants).filter(p => p !== username);
      const chatName = others[0] || chatFolder.split('_')[0];
      
      if (!isGroup) {
        chatCounts[chatName] = messages.length;
      }
      
      for (const msg of messages) {
        if (msg.isShared && msg.sender === username) {
          sharedTo[chatName] = (sharedTo[chatName] || 0) + 1;
        }
        if (msg.isShared && msg.sender !== username && msg.sender) {
          receivedFrom[msg.sender] = (receivedFrom[msg.sender] || 0) + 1;
        }
      }
      
      if (!isGroup) {
        for (let i = 0; i < messages.length - 1; i++) {
          const curr = messages[i];
          const next = messages[i + 1];
          if (curr.sender !== username && next.sender === username && curr.time && next.time) {
            const diff = (next.time.getTime() - curr.time.getTime()) / 1000;
            if (diff > 0 && diff < 3600) {
              responseTimes.push(diff);
            }
          }
        }
      }
    }
    
    data.topChatPartners = Object.entries(chatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    data.topSharedTo = Object.entries(sharedTo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    data.topReceivedFrom = Object.entries(receivedFrom)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    
    if (responseTimes.length > 0) {
      const avg = responseTimes.reduce((a, b) => a + b) / responseTimes.length;
      data.avgResponseTime = {
        hours: Math.floor(avg / 3600),
        minutes: Math.floor((avg % 3600) / 60)
      };
      console.log(`⚡ ${data.avgResponseTime.hours}h ${data.avgResponseTime.minutes}m`);
    }
  }

  console.log('✅ Done');
  return data;
}
