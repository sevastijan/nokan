/**
 * Extracts mentioned user IDs from text containing @{Name} mentions.
 * Matches mentions against the provided user list to resolve IDs.
 */
export function extractMentionedUserIds(
     text: string,
     users: Array<{ id: string; name?: string | null; custom_name?: string | null }>
): string[] {
     const mentionRegex = /@\{([^}]+)\}/g;
     const mentionedIds = new Set<string>();
     let match: RegExpExecArray | null;

     while ((match = mentionRegex.exec(text)) !== null) {
          const mentionedName = match[1].toLowerCase();

          const user = users.find(
               (u) =>
                    u.custom_name?.toLowerCase() === mentionedName ||
                    u.name?.toLowerCase() === mentionedName
          );

          if (user) {
               mentionedIds.add(user.id);
          }
     }

     return Array.from(mentionedIds);
}
