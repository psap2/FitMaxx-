import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { fonts } from '../theme/fonts';

interface MarkdownTextProps {
  content: string;
  style?: TextStyle;
}

export const MarkdownText: React.FC<MarkdownTextProps> = ({ content, style }) => {
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    let keyCounter = 0;

    // Regular expression to match markdown patterns: **bold**, *italic*, and newlines
    // Updated regex to handle nested cases better and not match single * inside **
    const markdownRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|\n)/g;
    const matches = Array.from(text.matchAll(markdownRegex));

    if (matches.length === 0) {
      // No markdown found, return plain text
      return [text];
    }

    for (const match of matches) {
      const matchIndex = match.index!;
      const matchedText = match[0];

      // Add text before the match
      if (matchIndex > currentIndex) {
        const beforeText = text.substring(currentIndex, matchIndex);
        if (beforeText) {
          parts.push(beforeText);
        }
      }

      // Process the matched markdown
      if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        // Bold text: **text**
        const boldText = matchedText.slice(2, -2);
        parts.push(
          <Text key={keyCounter++} style={[style, styles.bold]}>
            {boldText}
          </Text>
        );
      } else if (matchedText.startsWith('*') && matchedText.endsWith('*') && matchedText.length > 2) {
        // Italic text: *text*
        const italicText = matchedText.slice(1, -1);
        parts.push(
          <Text key={keyCounter++} style={[style, styles.italic]}>
            {italicText}
          </Text>
        );
      } else if (matchedText === '\n') {
        // Line break
        parts.push('\n');
      } else {
        // Fallback: just add as plain text
        parts.push(matchedText);
      }

      currentIndex = matchIndex + matchedText.length;
    }

    // Add remaining text after the last match
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText) {
        parts.push(remainingText);
      }
    }

    return parts.length > 0 ? parts : [text];
  };

  const parsedContent = parseMarkdown(content);

  return (
    <Text style={style}>
      {parsedContent}
    </Text>
  );
};

const styles = StyleSheet.create({
  bold: {
    fontFamily: fonts.bold,
  },
  italic: {
    fontStyle: 'italic',
  },
});

