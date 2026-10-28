export interface BibleVerse {
  book: string;
  chapter: string;
  verse: string;
  reference: string;
  text: string;
}

const FALLBACK_VERSES: BibleVerse[] = [
  {
    book: 'Filipenses',
    chapter: 'Filipenses 4',
    verse: '13',
    reference: 'Filipenses 4:13',
    text: 'Todo lo puedo en Cristo que me fortalece.',
  },
  {
    book: 'Salmos',
    chapter: 'Salmos 23',
    verse: '1-3',
    reference: 'Salmos 23:1-3',
    text: 'El Señor es mi pastor, nada me falta; en verdes pastos me hace descansar. Junto a tranquilas aguas me conduce; me infunde nuevas fuerzas.',
  },
  {
    book: 'Isaías',
    chapter: 'Isaías 40',
    verse: '31',
    reference: 'Isaías 40:31',
    text: 'Pero los que confían en el Señor renovarán sus fuerzas; volarán como las águilas: correrán y no se fatigarán, caminarán y no se cansarán.',
  },
  {
    book: '1 Corintios',
    chapter: '1 Corintios 10',
    verse: '13',
    reference: '1 Corintios 10:13',
    text: 'No os ha sobrevenido ninguna tentación que no sea humana; pero fiel es Dios, que no os dejará ser tentados más de lo que podéis resistir.',
  },
  {
    book: 'Proverbios',
    chapter: 'Proverbios 3',
    verse: '5-6',
    reference: 'Proverbios 3:5-6',
    text: 'Confía en el Señor de todo corazón, y no en tu propia inteligencia. Reconócelo en todos tus caminos, y él allanará tus sendas.',
  },
  {
    book: 'Mateo',
    chapter: 'Mateo 11',
    verse: '28',
    reference: 'Mateo 11:28',
    text: 'Venid a mí todos los que estáis cansados y agobiados, y yo os haré descansar.',
  },
  {
    book: 'Josué',
    chapter: 'Josué 1',
    verse: '9',
    reference: 'Josué 1:9',
    text: 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque el Señor tu Dios estará contigo en dondequiera que vayas.',
  },
];

let cachedBibleData: any = null;
let fetchPromise: Promise<any> | null = null;

async function loadBibleData(): Promise<any> {
  if (cachedBibleData) return cachedBibleData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      // 1. Cargar desde la carpeta pública servida por el bundler
      const response = await fetch('/biblia.json');
      if (response.ok) {
        cachedBibleData = await response.json();
        return cachedBibleData;
      }
    } catch (e) {
      console.warn('[bibleService] No se pudo cargar biblia.json de forma remota:', e);
    }
    return null;
  })();

  return fetchPromise;
}

export async function getRandomVerse(): Promise<BibleVerse> {
  try {
    const data = await loadBibleData();
    if (data && data.books && data.books.length > 0) {
      const book = data.books[Math.floor(Math.random() * data.books.length)];
      if (book && book.chapters && book.chapters.length > 0) {
        const chapter = book.chapters[Math.floor(Math.random() * book.chapters.length)];
        const verses = (chapter.items || []).filter(
          (i: any) => i.type === 'verse' && i.lines && i.lines.length > 0
        );

        if (verses.length > 0) {
          const verse = verses[Math.floor(Math.random() * verses.length)];
          const verseNum = (verse.verse_numbers || []).join('-');
          const cleanText = (verse.lines || [])
            .join(' ')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (cleanText.length > 5) {
            return {
              book: book.human,
              chapter: chapter.human,
              verse: verseNum,
              reference: `${chapter.human}:${verseNum}`,
              text: cleanText,
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[bibleService] Error al obtener versículo:', err);
  }

  // Fallback garantizado de versículos de fortaleza y sobriedad
  const fallback = FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)];
  return fallback;
}
