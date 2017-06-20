import { expectSaga } from 'redux-saga-test-plan';
// import { delay } from 'redux-saga';

import * as matchers from 'redux-saga-test-plan/matchers';
import { call, select } from 'redux-saga/effects';

import { setItem, removeItem } from '../utils/safe_storage';

import { fromJS } from 'immutable';

import {
  postTokensOSMCha,
  postFinalTokensOSMCha,
  fetchUserDetails
} from '../network/auth';

import {
  watchAuth,
  authTokenFlow,
  AUTH,
  getTokenSelector
} from './auth_actions';
import { authReducer } from './auth_reducer';
import nock from 'nock';
const delay = time =>
  new Promise(resolve => {
    setTimeout(resolve, time);
  });
const token = '2d2289bd78985b2b46af29607ee50fa37cb1723a';
const oauth_verifier = 'xbiZdWS1EYS608suvHrL';
const oauth_token_secret = 'C2l9h7YEC1AzSyCi1aTKmsOi0WmEU7DMolabWrPZ';
const oauth_token = 'zi2Lu2r5H1z5ZTbQ2YIjZJHRnwmOHKpBfvWu83ZG';

describe('auth actions testing', () => {
  beforeEach(() => {});
  afterEach(() => {
    nock.cleanAll();
  });
  it('test authTokenFlow ', async () => {
    const result = await expectSaga(authTokenFlow)
      .provide([
        [
          matchers.call.fn(postTokensOSMCha),
          { oauth_token_secret, oauth_token }
        ],
        [
          matchers.call.fn(postFinalTokensOSMCha),
          {
            token
          }
        ],
        [matchers.call.fn(setItem)]
      ])
      .put({
        type: AUTH.saveOAuth,
        oauth_token_secret,
        oauth_token
      })
      .dispatch({
        type: AUTH.getFinalToken,
        oauth_verifier
      })
      .delay(100)
      .dispatch({
        type: AUTH.saveToken,
        token,
        oauth_verifier
      })
      .run();
    const { effects } = result;
    expect(effects.call).toHaveLength(5);
    expect(effects.put).toHaveLength(1);
    expect(effects.call[0]).toEqual(call(postTokensOSMCha));
    expect(effects.call[1]).toEqual(
      call(
        postFinalTokensOSMCha,
        oauth_token,
        oauth_token_secret,
        oauth_verifier
      )
    );
    expect(result.toJSON()).toMatchSnapshot();
  });
  it('test watchAuth with token', async () => {
    const userDetails = {
      id: 33,
      uid: '3563274',
      username: 'kepta',
      is_staff: true,
      is_active: true,
      email: '',
      avatar:
        'http://www.gravatar.com/avatar/8be7bdc2d8cde52fb8900c8d0c813faf.jpg?s=256&d…large-afe7442b856c223cca92b1a16d96a3266ec0c86cac8031269e90ef93562adb72.png'
    };
    const result = await expectSaga(watchAuth)
      .provide([
        [select(getTokenSelector), token],
        [matchers.call.fn(fetchUserDetails), userDetails],
        [matchers.call.fn(removeItem)],
        [matchers.call.fn(authTokenFlow), token]
      ])
      .put({
        type: AUTH.userDetails,
        userDetails: fromJS(userDetails)
      })
      .put({
        type: AUTH.clearSession
      })
      .delay(100)
      .dispatch({ type: AUTH.logout })
      .silentRun(2000);

    const { effects } = result;
    expect(effects.call[0]).toEqual(call(fetchUserDetails, token));
    expect(effects.select.length).toEqual(1);
    expect(effects.put).toHaveLength(2);
  });
  it('test watchAuth error', async () => {
    const userDetails = {
      id: 33,
      uid: '3563274',
      username: 'kepta',
      is_staff: true,
      is_active: true,
      email: '',
      avatar:
        'http://www.gravatar.com/avatar/8be7bdc2d8cde52fb8900c8d0c813faf.jpg?s=256&d…large-afe7442b856c223cca92b1a16d96a3266ec0c86cac8031269e90ef93562adb72.png'
    };
    const result = await expectSaga(watchAuth)
      .provide([
        [select(getTokenSelector), token],
        [matchers.call.fn(fetchUserDetails), userDetails],
        [matchers.call.fn(removeItem)],
        [matchers.call.fn(authTokenFlow), token]
      ])
      .put({
        type: AUTH.userDetails,
        userDetails: fromJS(userDetails)
      })
      .put({
        type: AUTH.clearSession
      })
      .delay(100)
      .dispatch({ type: AUTH.logout })
      .silentRun(2000);

    const { effects } = result;
    expect(effects.call[0]).toEqual(call(fetchUserDetails, token));
    expect(effects.select.length).toEqual(1);
    expect(effects.put).toHaveLength(2);
  });
});
