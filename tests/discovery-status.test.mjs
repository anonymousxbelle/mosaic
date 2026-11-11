import test from 'node:test';
import assert from 'node:assert/strict';
import {discoveryStatus} from '../lib/discovery-status.ts';
const state={loading:false,failed:false,partial:false,count:0};
test('zero results never announces matches ready',()=>assert.match(discoveryStatus(state),/No matches/));
test('source failure offers retry instead of no-match advice',()=>assert.match(discoveryStatus({...state,failed:true}),/temporarily unavailable.*again/));
test('partial failure is disclosed even with results',()=>assert.match(discoveryStatus({...state,partial:true,count:4}),/incomplete/));
test('loading supersedes old result counts',()=>assert.match(discoveryStatus({...state,loading:true,count:4}),/Finding/));
test('successful nonempty results announce ready',()=>assert.equal(discoveryStatus({...state,count:4}),'Your matches are ready.'));

