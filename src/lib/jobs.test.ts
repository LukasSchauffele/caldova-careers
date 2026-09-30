import { describe, it, expect } from 'vitest';
import { sortByNewest, formatPostedDate, filterJobsByTitle, summarizeJobs } from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('summarizeJobs', () => {
    it('counts open roles and distinct hiring departments', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-02-01'),
            { ...makeJob('c', '2027-03-01'), department: 'Clinical' },
        ];
        expect(summarizeJobs(jobs)).toEqual({ openRoles: 3, hiringDepartments: 2 });
    });

    it('returns zero counts when there are no open roles', () => {
        expect(summarizeJobs([])).toEqual({ openRoles: 0, hiringDepartments: 0 });
    });
});

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});

describe('filterJobsByTitle', () => {
    it('matches title substrings case-insensitively and preserves order', () => {
        const jobs = [makeJob('first', '2027-01-01'), makeJob('second', '2027-01-02'), makeJob('third', '2027-01-03')];
        jobs[0].title = 'Clinical Research Scientist';
        jobs[1].title = 'Senior Frontend Engineer';
        jobs[2].title = 'Research Operations Lead';

        expect(filterJobsByTitle(jobs, 'RESEARCH').map((job) => job.slug)).toEqual(['first', 'third']);
    });

    it('returns a new copy of all jobs for an empty query', () => {
        const jobs = [makeJob('first', '2027-01-01'), makeJob('second', '2027-01-02')];

        const result = filterJobsByTitle(jobs, '');

        expect(result).toEqual(jobs);
        expect(result).not.toBe(jobs);
    });

    it('returns all jobs for a whitespace-only query', () => {
        const jobs = [makeJob('first', '2027-01-01'), makeJob('second', '2027-01-02')];

        expect(filterJobsByTitle(jobs, '   ').map((job) => job.slug)).toEqual(['first', 'second']);
    });

    it('returns an empty array when no titles match', () => {
        const jobs = [makeJob('first', '2027-01-01'), makeJob('second', '2027-01-02')];

        expect(filterJobsByTitle(jobs, 'unmatched')).toEqual([]);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('first', '2027-01-01'), makeJob('second', '2027-01-02')];
        const originalJobs = [...jobs];

        filterJobsByTitle(jobs, 'first');

        expect(jobs).toEqual(originalJobs);
    });
});
