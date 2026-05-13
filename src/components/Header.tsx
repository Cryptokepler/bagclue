'use client';

import AnnouncementBar from './AnnouncementBar';
import Navbar from './Navbar';

export default function Header() {
  return (
    <header className="sticky top-0 z-[100]">
      <AnnouncementBar />
      <Navbar />
    </header>
  );
}
