import {useState, useMemo} from 'react';


class SpanManager {
    constructor(spans, spanStates, setSpanStates, regionMap) {
        this.spans = spans;

        // An immutable map from spanId to state
        this._spanStates = spanStates;

        // Change _spanStates (triggers a rerender)
        this._setSpanStates = setSpanStates;

        this._regionMap = regionMap;
    }

    activate(region) {
        const groupId = this._regionMap.getGroupId(region);
        if (groupId === null) {
            return;
        }

        const spanStates = this.spans.reduce((acc, span) => {
            // Don't overwrite a selected span
            if (this._spanStates[span.id] === Span.STATES.SELECTED) {
                acc[span.id] = Span.STATES.SELECTED;
            }
            // Set all spans in group to
            else if (span.groupId === groupId) {
                acc[span.id] = Span.STATES.ACTIVE;
            }
            // Set everything else to inactive
            else {
                acc[span.id] = Span.STATES.INACTIVE;
            }

            return acc;
        }, {});

        this._setSpanStates(spanStates);
    }

    select(region) {
        const groupId = this._regionMap.getGroupId(region);
        if (groupId === null) {
            return;
        }

        const spanStates = this.spans.reduce((acc, span) => {
            // Set all spans in group to
            if (span.groupId === groupId) {
                acc[span.id] = Span.STATES.SELECTED;
            }
            // Set everything else to inactive
            else {
                acc[span.id] = Span.STATES.INACTIVE;
            }

            return acc;
        }, {});

        console.log(spanStates);

        this._setSpanStates(spanStates);
    }

    isActive(region) {
        return this._getState(region) === Span.STATES.ACTIVE;
    }

    isSelected(region) {
        return this._getState(region) === Span.STATES.SELECTED;
    }

    isGrouped(region) {
        return this._regionMap.getGroupId(region) !== null;
    }

    _getState(region) {
        const span = this._regionMap.getSpan(region);

        if (span === null) {
            return Span.STATES.INACTIVE;
        }

        return this._spanStates[span.id];
    }
}


// Immutable map from a region in a file to a span/group
class RegionMap {
    constructor(spans, groups) {
        this.spans = spans;
        this._groups = groups;
    }

    getSpan(region) {
        // TODO likely candidate for optimization, memoization might be good enough, KISS for now
        let largestSpan = null;

        this.spans.forEach(span => {
            // span is from the same file, and starts and finishes before region
            const contains = span.fileId === region.fileId && span.start <= region.start && span.end >= region.end;

            // The largest span takes priority
            const isLargest = largestSpan === null || largestSpan.end - largestSpan.start < span.end - span.start;

            if (contains && isLargest) {
                largestSpan = span;
            }
        });

        return largestSpan;
    }

    getGroupId(region, state) {
        const span = this.getSpan(region);
        return span !== null ? span.groupId : null;
    }
}


class Span {
    static STATES = {
        INACTIVE: 0,
        ACTIVE: 1,
        SELECTED: 2
    }

    constructor(id, fileId, groupId, start, end, isIgnored=false) {
        this.id = id;
        this.fileId = fileId;
        this.groupId = groupId;
        this.start = start;
        this.end = end;
        this.isIgnored = isIgnored;
    }
}


function useSpanManager(pass) {
    const initSpans = () => {
        const spans = [];
        pass.groups.forEach((group, groupId) => {
            group.forEach(span => {
                spans.push(new Span(span.id, span.fileId, groupId, span.start, span.end));
            });
        });
        return spans;
    }
    // TODO ignored spans

    // Memoize the (expensive) mapping from regions to spans on the selected pass
    const spans = useMemo(initSpans, [pass.pass]);
    const regionMap = useMemo(() => new RegionMap(spans, pass.groups), [pass.pass]);

    const [spanStates, setSpanStates] = useState(spans.reduce((acc, span) => {
        acc[span.id] = Span.STATES.INACTIVE;
        return acc;
    }, {}));

    return [new SpanManager(spans, spanStates, setSpanStates, regionMap)];
}

export {SpanManager, Span, RegionMap}
export default useSpanManager