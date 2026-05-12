# Premium Wedding Invitation Platform

A Vite, React, TypeScript, Tailwind CSS, and Framer Motion wedding invitation website with a watercolor video opening screen, English content, private UUID invite routes, and localStorage RSVP persistence.

## Run Locally

```bash
npm install
npm run dev
```

Open the app at the Vite URL shown in the terminal.

## Routes

- `/` redirects to the sample private invitation UUID.
- `/invite/:uuid` opens the private invitation.

## Project Structure

```text
public/assets/
  gazebo-watercolor.mp4
  gazebo-watercolor.gif
  gazebo-watercolor-poster.jpg
src/
  components/
  config/
  hooks/
  pages/
  themes/
  types/
  utils/
```

## Customization

Edit `src/config/weddingConfig.ts` to replace names, wedding date, story items, venue, Google Maps links, gallery entries, RSVP options, and the hero asset paths.

Edit `src/themes/themes.ts` and `src/styles.css` to refine the watercolor garden theme.

RSVP data is stored in localStorage with the key pattern:

```text
wedding-platform:rsvp:<uuid>
```
