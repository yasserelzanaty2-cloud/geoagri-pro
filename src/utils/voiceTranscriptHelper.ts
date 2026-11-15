export interface SpeechResultAlternativeLike {
  transcript: string;
}

export interface SpeechResultItemLike {
  isFinal?: boolean;
  0?: SpeechResultAlternativeLike;
}

export interface SpeechResultListLike {
  length: number;
  [index: number]: SpeechResultItemLike;
}

export interface ExtractedSpeechTranscript {
  finalText: string;
  interimText: string;
  hasContent: boolean;
}

export function extractTranscriptFromResults(
  results: SpeechResultListLike | undefined | null
): ExtractedSpeechTranscript {
  if (!results || typeof results.length !== 'number' || results.length <= 0) {
    return { finalText: '', interimText: '', hasContent: false };
  }

  const finalParts: string[] = [];
  const interimParts: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const item = results[i];
    const raw = item?.[0]?.transcript;
    if (typeof raw !== 'string') continue;
    const cleaned = raw.replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;

    if (item.isFinal) {
      finalParts.push(cleaned);
    } else {
      interimParts.push(cleaned);
    }
  }

  const finalText = finalParts.join(' ').replace(/\s+/g, ' ').trim();
  const interimText = interimParts.join(' ').replace(/\s+/g, ' ').trim();

  return {
    finalText,
    interimText,
    hasContent: finalText.length > 0 || interimText.length > 0,
  };
}

export function combineVoiceTranscript(
  prefixText: string,
  finalSegment: string,
  interimSegment = ''
): string {
  return [prefixText, finalSegment, interimSegment]
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
