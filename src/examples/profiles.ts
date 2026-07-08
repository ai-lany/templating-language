/** Sample profiles written in the DSL, used to seed the editor. */

export const SAMPLE_PROFILE = `@theme accent=#7b61ff radius=12 font=default mode=light

# header
name: Ada Lovelace
handle: @ada
avatar: https://i.pravatar.cc/160?img=47
tagline: Mathematician · writing notes on the Analytical Engine

# stats
- Posts | 128
- Followers | 3.2k
- Following | 180

# bio
title: About
I like poetry and machines in equal measure. This page is a small corner of
the internet where I collect both.

Currently thinking about how numbers might one day make music.

# links
- Notes | https://example.com/notes
- Bytes newsletter | https://example.com/bytes
- Contact | https://example.com/hello

# gallery
- https://picsum.photos/seed/ada1/300 | Loom study
- https://picsum.photos/seed/ada2/300 | Engine sketch
- https://picsum.photos/seed/ada3/300 | Marginalia

# note
color: pink
Reblogging is encouraged. Be kind. ✨

# divider
label: fin
`;

export const NEON_PROFILE = `@theme accent=#ff5ecb radius=4 font=mono mode=dark

# header
name: synthwave
handle: @neon
avatar: https://i.pravatar.cc/160?img=12
tagline: night-shift pixels

# note
color: purple
under construction — check back soon

# links
- soundcloud | https://example.com/sc
- bandcamp | https://example.com/bc
`;

export const SAMPLES: { label: string; source: string }[] = [
  { label: 'Ada', source: SAMPLE_PROFILE },
  { label: 'Neon', source: NEON_PROFILE },
];
