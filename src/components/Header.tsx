'use client';

import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';

export default function Header() {
  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />
      <Navbar />
    </header>
  );
}
