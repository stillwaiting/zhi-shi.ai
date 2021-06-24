# Format of the data files

## References

To reference a particular section, use (link text)[section_title_without_spaces_or_quotes_or_any_other_symbols] link.

If you want to reference a particular place inside the section:
1. make it with the following syntax: [#my_section]some important information[/].
2. use the following link (link text)[section_title_without_spaces_or_quotes_or_any_other_symbols#my_section].


## Tasks section

Marked by "###... Tasks" header and belongs to the section above.

Each task has format

```
## Tasks

- Sentence1 sentence sentence (d1-correct-answer1|d1-incorrect-answer-2|...) blah blah (d2-correct-answer1|d2-incorrect-answer-2|...)

   :: some explanation for sentence1 d1

   :: some explanation for d2

- Another sentence ....
  
   :: some explanation for another sentence's dropdown

   ...

```

This section is split onto "sentences", where each "sentence" is a single study unit displayed to the user at the time.

The lines with `"-"` at the beginning represent the beginning of the sentences. All `(foo|bar|...)` substrings are replaced with dropdowns (questions) with options taken from the content of this substring (`"|"` acts as a delimeter between the options). The first option should always be the correct answer.

The lines with `"::"` at the beginning represent the description to the relevant dropboxes (answers).


