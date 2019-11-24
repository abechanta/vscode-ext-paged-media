:::{style="color:lightgreen"}

## Unnumbered Section at First Chapter {.unnumbered}

```style
kbd {
	color: black;
	background-color: darkgray;
	border-radius: 2px;
	padding: 2px 4px;
}
table {
	border-collapse: collapse;
	margin: 1em auto 1em auto;
}
th, td {
	border: 2px solid !important;
}
h1:before,
h2:before,
h3:before {
	content: open-quote attr(data-chapter-number) close-quote;
}
h1.unnumbered:before,
h2.unnumbered:before,
h3.unnumbered:before {
	content: "";
}
```

[[CTRL]] + [[A]] means "Select All".

Hello {A.S.A.P.|as soon as possible}

:::

First header | Second header
-------------|---------------
List:        | More  \
- over       | data  \
- several    |       \
- lines      |
[Table 1: Multiple lines of row]

First header | Second header
-------------|---------------
Merged       | Cell 1
^^           | Cell 2
^^           | Cell 3
[Table 2: Rowspan]

Here is a footnote reference,[^1] and another.[^longnote]

[^1]: Here is the footnote.

[^longnote]: Here's one with multiple blocks.

    Subsequent paragraphs are indented to show that they
belong to the previous footnote.

- [Goto Previous Chapter][chapter1]{.ref-page}
- [Goto Next Chapter][chapter2]
- [][chapter2]
