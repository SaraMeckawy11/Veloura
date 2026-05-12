import gallery1 from '../../assets/gallery-1.jpg';
import gallery2 from '../../assets/gallery-2.jpg';
import gallery3 from '../../assets/gallery-3.jpg';
import gallery4 from '../../assets/gallery-4.jpg';
import gallery5 from '../../assets/gallery-5.jpg';
import gallery6 from '../../assets/gallery-6.jpg';
import story1 from '../../assets/story-1.jpg';
import story2 from '../../assets/story-2.jpg';
import story3 from '../../assets/story-3.jpg';

export const GAZEBO_GARDEN_DEMO_ORDER = {
  referenceLayout: true,
  weddingDetails: {
    groomName: 'Lina',
    brideName: 'Omar',
    weddingDate: '2026-06-06T15:30:00.000Z',
    weddingTime: '5:30 PM',
    venue: 'Villa Aurelia Gardens',
    venueAddress: 'Largo di Porta San Pancrazio, 1, 00153 Rome, Italy',
    venueMapUrl:
      'https://www.google.com/maps?q=Villa%20Aurelia%20Rome&output=embed',
    message: 'A garden promise sealed in soft light.',
    flightNo: 'GAZEBO-2026',
  },
  storyMilestones: [
    {
      date: 'Spring 2021',
      title: 'The First Hello',
      description: 'A quiet afternoon, a table by the window, and a conversation that somehow felt familiar from the very first minute.',
      imageLabel: 'Cafe light',
    },
    {
      date: 'Summer 2023',
      title: 'A City Became Ours',
      description: 'Weekend walks turned into a map of favorite corners, late dinners, old streets, and tiny rituals only they understood.',
      imageLabel: 'Old street',
    },
    {
      date: 'Winter 2025',
      title: 'The Question',
      description: 'Under soft lights and winter flowers, a yes arrived before the sentence was even finished.',
      imageLabel: 'Winter florals',
    },
  ],
  storyImages: [story1, story2, story3],
  galleryImages: [gallery1, gallery2, gallery3, gallery4, gallery5, gallery6],
  photos: [],
};
