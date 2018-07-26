from .data import _IdStore
import pygments
from pygments.formatters import HtmlFormatter, TerminalFormatter
import collections
import attr

class Fragments:
    def __init__(self, file):
        with open(file.path) as f:
            self._content = f.read()
        self._indices = set()
        self._start_to_spans = collections.defaultdict(set)
        self._end_to_spans = collections.defaultdict(set)

    def create(self):
        indices = sorted(list(self._indices))
        spans_at = []
        prev = set()
        for index in [0] + indices:
            cur = set(prev)
            cur |= self._start_to_spans[index]
            cur -= self._end_to_spans[index]
            spans_at.append(cur)
            prev = cur

        fragments = Fragment(self._content).split(*indices)
        for i, fragment in enumerate(fragments):
            fragment.spans = spans_at[i]

        return fragments

    def add_span(self, span):
        self._indices.add(span.start)
        self._indices.add(span.end)
        self._start_to_spans[span.start].add(span)
        self._end_to_spans[span.end].add(span)


@attr.s(slots=True)
class Fragment:
    content = attr.ib()
    spans = attr.ib(default=attr.Factory(set))

    def split(self, index, *indices):
        indices = [index] + list(indices) + [len(self.content)]
        fragments = []
        start_index = 0
        for index in indices:
            content = self.content[start_index:index]
            fragments.append(Fragment(content, set(self.spans)))
            start_index = index
        return fragments


def render(submission_groups):
    for sub_a, sub_b, groups in submission_groups:
        span_to_group = {}
        file_to_spans = collections.defaultdict(list)

        for group in groups:
            for span in group.spans:
                file_to_spans[span.file].append(span)
                span_to_group[span] = group

        for file in file_to_spans:
            fragments = fragmentize(file, file_to_spans[file])
            render_file(file, fragments, span_to_group)


def render_file(file, fragments, span_to_group):
    formatter = TerminalFormatter(linenos=True, bg="dark")
    print("*" * 80)
    print(file.name)
    print("*" * 80)
    for fragment in fragments:
        groups = list({span_to_group[span] for span in fragment.spans})
        print(pygments.highlight(fragment.content, file.lexer(), formatter))
        print("Spans:", fragment.spans)
        print("Number of groups:", len(groups))
        print("Matches with:", [group.spans for group in groups])
        print("=" * 80)


def fragmentize(file, spans):
    fragments = Fragments(file)
    for span in spans:
        fragments.add_span(span)
    return fragments.create()





#
#     return
#
#     dest = pathlib.Path(dest)
#
#     if not dest.exists():
#         os.mkdir(dest)
#
#     subs_to_groups = collections.defaultdict(list)
#
#     for group in groups:
#         subs_to_groups[(group.sub_a, group.sub_b)].append(group)
#
#     subs_groups = [(sm.sub_a, sm.sub_b, subs_to_groups[(sm.sub_a, sm.sub_b)]) for sm in submission_matches]
#
#     formatter = HtmlFormatter(linenos=True)
#
#     with open(dest / "style.css", "w") as f:
#         f.write(formatter.get_style_defs('.highlight'))
#
#     for i, (sub_a, sub_b, groups) in enumerate(subs_groups):
#         with open(dest / "match_{}.html".format(i), "w") as f:
#             f.write('<link rel="stylesheet" type="text/css" href="{}">'.format("style.css"))
#             f.write("{} {}<br/>".format(sub_a.path, sub_b.path))
#
#             for group in groups:
#                 f.write(" ".join(str(span) for span in group.spans))
#                 f.write("<br/>")
#
#             for html in mark_matches(sub_a, sub_b, groups, formatter):
#                 f.write(html)
#
#             # for sub in (sub_a, sub_b):
#             #     for file in sub.files():
#             #         with open(file.path) as in_file:
#             #             f.write(mark_matches(in_file.read(), formatter, file.lexer()))
#
# def mark_matches(sub_a, sub_b, groups, formatter):
#     htmls = []
#     for file in sub_a.files():
#         file_spans = [span for group in groups for span in group.spans if span.file.id == file.id]
#         with open(file.path) as f:
#             highlighted_html = pygments.highlight(f.read(), file.lexer(), formatter)
#
#         soup = BeautifulSoup(highlighted_html, 'html.parser')
#         for s in soup.find_all("span"):
#             print(dir(s))
#             print(s.contents)
#
#         htmls.append(str(soup))
#
#     return htmls
