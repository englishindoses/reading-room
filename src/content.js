export async function loadCatalogue() {
  const response = await fetch('./content/catalogue.json');
  if (!response.ok) throw new Error('The book catalogue could not be opened. Reconnect and reload to download it.');
  const paths = await response.json();
  return Promise.all(paths.map(async path => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('A sample book could not be downloaded. Please reload while online.');
    const book = await response.json();
    book.cover = new URL(book.cover, new URL(path, location.href)).href;
    for (const page of book.pages) {
      for (const field of ['image', 'audio']) if (page[field]) page[field] = new URL(page[field], new URL(path, location.href)).href;
    }
    return book;
  }));
}
export function checkAnswer(question, answer) {
  if (typeof answer !== 'string' || !answer.length) return false;
  const normalize = value => {
    if (question.normalization?.trim) value = value.trim();
    if (question.normalization?.caseInsensitive) value = value.toLocaleLowerCase();
    return value;
  };
  return (question.acceptedAnswers || [question.answer]).some(expected => normalize(expected) === normalize(answer));
}
export const activityTypes = new Set(['multiple-choice', 'true-false', 'typed-gap', 'select-gap', 'matching', 'drag-drop']);
