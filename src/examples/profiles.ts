/** Sample profiles written in the bracket-tag DSL, used to seed the editor. */

export const SAMPLE_PROFILE = `[theme accent=#7b61ff radius=12 font=default mode=light]

[header name="Ada Lovelace" handle=@ada avatar="https://i.pravatar.cc/160?img=47"]
  Mathematician · writing notes on the Analytical Engine
[/header]

[row gap=6 align=flex-start]
  [col gap=5]
    [row gap=6]
      [stat label=Posts value=128]
      [stat label=Followers value=3.2k]
      [stat label=Following value=180]
    [/row]

    [section title=About]
      [text]I like poetry and machines in equal measure. This page is a small corner of the internet where I collect both.

      Currently thinking about how numbers might one day make music.[/text]
    [/section]

    [section title=Elsewhere]
      [link url="https://example.com/notes"]Notes[/link]
      [link url="https://example.com/bytes"]Bytes newsletter[/link]
      [link url="https://example.com/hello"]Contact[/link]
    [/section]
  [/col]

  [col gap=4]
    [note color=pink]Reblogging is encouraged. Be kind. ✨[/note]
    [grid cols=2 gap=3]
      [image src="https://picsum.photos/seed/ada1/300" caption="Loom study"]
      [image src="https://picsum.photos/seed/ada2/300" caption="Engine sketch"]
      [image src="https://picsum.photos/seed/ada3/300" caption="Marginalia"]
      [image src="https://picsum.photos/seed/ada4/300" caption="Notation"]
    [/grid]
  [/col]
[/row]

[divider label=fin]
`;

export const NEON_PROFILE = `[theme accent=#ff5ecb radius=4 font=mono mode=dark]

[header name="synthwave" handle=@neon avatar="https://i.pravatar.cc/160?img=12"]
  night-shift pixels
[/header]

[row gap=5]
  [note color=purple]under construction — check back soon[/note]
  [col gap=2]
    [link url="https://example.com/sc"]soundcloud[/link]
    [link url="https://example.com/bc"]bandcamp[/link]
  [/col]
[/row]
`;

export const SAMPLES: { label: string; source: string }[] = [
  { label: 'Ada', source: SAMPLE_PROFILE },
  { label: 'Neon', source: NEON_PROFILE },
];
