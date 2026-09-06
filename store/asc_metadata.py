"""Plainly App Store metadata + screenshots via ASC API. Idempotent. Run from landed/.credentials with PYTHONPATH=."""
import asc, json, os, glob, time
APP='6809072326'
SUBS=tuple(x for x in os.environ.get('SIZEDOWN_SUBS','').split(',') if x)
SHOTS=sorted(glob.glob('/Users/raymondzhao/workspace/sizedown/store/screenshots/0*.png'))
SHOTS65=sorted(glob.glob('/Users/raymondzhao/workspace/sizedown/store/screenshots65/0*.png'))
DESC="""The trading journal that shows you the tilt tax.

Log a trade in ten seconds. Tag how you felt going in. Set your rules once: daily loss limit, max trades, stop after two losses, cool-off. Then Size Down shows you the one number no broker will: what your account would be if you had followed them.

TEN-SECOND TRADE LOG
Symbol, side, result, setup, how you felt, did you follow the plan. No broker login, no sync bugs, no missing trades. You type it; that is the part that changes behaviour.

YOUR RULES, IN YOUR WORDS
The app never blocks a trade. It shows you the rule you wrote at the moment you are about to break it. You decide.

THE TILT TAX
Every FOMO, revenge, tilted, bored, anxious or euphoric trade, and every trade with a broken rule, summed. Next to it, what disciplined-you made. By setup, feeling, hour and weekday.

PROP-FIRM EVAL TRACKER
Presets for Apex Trader Funding, Topstep, FTMO, MyFundedFutures and FundedNext, or type your own rules. Static, end-of-day trailing and intraday trailing drawdown computed correctly. Profit target, daily loss, consistency rule and the buffer to the floor, always on screen.

DAILY PLAN AND GRADE
Write the plan before the open. Write what happened after the close. Grade the day A to F. A calendar of green, red and clean days.

FREE AND PRO
Free: 30 trades a month, one eval, 7-day analytics. Size Down Pro: unlimited trades and evals, full analytics, CSV export. Pro is an auto-renewable subscription (monthly or yearly). Payment is charged to your Apple ID account at confirmation of purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your Apple ID settings.

Size Down is a journal for your own decisions. It does not place trades, provide signals or promise results. Trading involves substantial risk of loss.

Terms of Use (EULA): https://tryforma.app/sizedown/terms.html
Privacy Policy: https://tryforma.app/sizedown/privacy.html"""
KEYWORDS="trading journal,day trading,futures,prop firm,apex,topstep,ftmo,drawdown,trade log,options,stocks,tradezella,forex"
PROMO="Log a trade in ten seconds, set your rules once, and see the tilt tax: what you would have made if you had followed them. Prop-firm evals with real drawdown math."
def ok(r,what):
    if 'data' in r: return r['data']
    print('FAIL',what,json.dumps(r)[:600]); return None
v=asc.api('GET',f'/v1/apps/{APP}/appStoreVersions?filter[platform]=IOS&limit=1&fields[appStoreVersions]=versionString,appStoreState')['data'][0]
VID=v['id']; print('version', v['attributes'])
locs=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreVersionLocalizations')['data']
en=next((l for l in locs if l['attributes']['locale']=='en-US'),None)
attrs={'description':DESC,'keywords':KEYWORDS[:100],'promotionalText':PROMO[:170],'supportUrl':'https://tryforma.app/sizedown/','marketingUrl':'https://tryforma.app/sizedown/'}
if en: r=asc.api('PATCH',f"/v1/appStoreVersionLocalizations/{en['id']}",{'data':{'type':'appStoreVersionLocalizations','id':en['id'],'attributes':attrs}})
else: r=asc.api('POST','/v1/appStoreVersionLocalizations',{'data':{'type':'appStoreVersionLocalizations','attributes':dict(attrs,locale='en-US'),'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
en=ok(r,'version loc'); print('version localization ok', en['id'] if en else '')
infos=asc.api('GET',f'/v1/apps/{APP}/appInfos')['data']
for info in infos:
    il=asc.api('GET',f"/v1/appInfos/{info['id']}/appInfoLocalizations")['data']
    l=next((x for x in il if x['attributes']['locale']=='en-US'),None)
    a={'subtitle':'Rules, tilt tax, prop evals','privacyPolicyUrl':'https://tryforma.app/sizedown/privacy.html'}
    if l: r=asc.api('PATCH',f"/v1/appInfoLocalizations/{l['id']}",{'data':{'type':'appInfoLocalizations','id':l['id'],'attributes':a}})
    else: r=asc.api('POST','/v1/appInfoLocalizations',{'data':{'type':'appInfoLocalizations','attributes':dict(a,locale='en-US'),'relationships':{'appInfo':{'data':{'type':'appInfos','id':info['id']}}}}})
    print('appInfo loc', 'ok' if 'data' in r else json.dumps(r)[:300])
    r=asc.api('PATCH',f"/v1/appInfos/{info['id']}",{'data':{'type':'appInfos','id':info['id'],'relationships':{'primaryCategory':{'data':{'type':'appCategories','id':'FINANCE'}},'secondaryCategory':{'data':{'type':'appCategories','id':'PRODUCTIVITY'}}}}})
    print('categories', 'ok' if 'data' in r else json.dumps(r)[:300])
r=asc.api('PATCH',f'/v1/apps/{APP}',{'data':{'type':'apps','id':APP,'attributes':{'contentRightsDeclaration':'DOES_NOT_USE_THIRD_PARTY_CONTENT'}}}); print('content rights', 'ok' if 'data' in r else json.dumps(r)[:200])
r=asc.api('PATCH',f'/v1/appStoreVersions/{VID}',{'data':{'type':'appStoreVersions','id':VID,'attributes':{'copyright':'2026 RZ International LLC','releaseType':'AFTER_APPROVAL'}}}); print('version attrs', 'ok' if 'data' in r else json.dumps(r)[:200])
rd=asc.api('GET',f'/v1/appStoreVersions/{VID}/appStoreReviewDetail')
ra={'contactFirstName':'Ruihao','contactLastName':'Zhao','contactPhone':'+14155550100','contactEmail':'ray@thezenithlabs.com','demoAccountRequired':False,'notes':'Size Down is a trading journal (18+ recommended; no gambling, no brokerage connection, no trade execution, no signals). NO demo account: an anonymous account is created on first launch. Onboarding is four screens (markets, account size, rules); any values work. Tabs: Today (log a trade, daily plan), Journal (stats, calendar), Rules, Evals (prop-firm challenge tracker: pick a preset firm and account size), Me (Pro, export, delete account per 5.1.1). Pro subscription (monthly/yearly) unlocks unlimited trades/evals, full analytics and CSV export; free tier is fully functional for 30 trades a month. All prices on the paywall show the billed amount as the dominant element. Not financial advice.'}
if rd.get('data'): r=asc.api('PATCH',f"/v1/appStoreReviewDetails/{rd['data']['id']}",{'data':{'type':'appStoreReviewDetails','id':rd['data']['id'],'attributes':ra}})
else: r=asc.api('POST','/v1/appStoreReviewDetails',{'data':{'type':'appStoreReviewDetails','attributes':ra,'relationships':{'appStoreVersion':{'data':{'type':'appStoreVersions','id':VID}}}}})
print('review detail', 'ok' if 'data' in r else json.dumps(r)[:300])
if en and SHOTS:
    for disp, files in (('APP_IPHONE_67', SHOTS), ('APP_IPHONE_65', SHOTS65)):
        sets=asc.api('GET',f"/v1/appStoreVersionLocalizations/{en['id']}/appScreenshotSets?fields[appScreenshotSets]=screenshotDisplayType")['data']
        st=next((s for s in sets if s['attributes']['screenshotDisplayType']==disp),None)
        if not st: st=ok(asc.api('POST','/v1/appScreenshotSets',{'data':{'type':'appScreenshotSets','attributes':{'screenshotDisplayType':disp},'relationships':{'appStoreVersionLocalization':{'data':{'type':'appStoreVersionLocalizations','id':en['id']}}}}}),'set')
        have=[x['attributes']['fileName'] for x in asc.api('GET',f"/v1/appScreenshotSets/{st['id']}/appScreenshots?fields[appScreenshots]=fileName")['data']]
        for f in files:
            if os.path.basename(f) in have: continue
            r=asc.upload_asset('/v1/appScreenshots',{'data':{'type':'appScreenshots','attributes':{'fileName':os.path.basename(f)},'relationships':{'appScreenshotSet':{'data':{'type':'appScreenshotSets','id':st['id']}}}}},f,'appScreenshots')
            print('  shot', disp, os.path.basename(f), 'ok' if 'data' in r else json.dumps(r)[:200])
for sid in SUBS:
    cur=asc.api('GET',f'/v1/subscriptions/{sid}/appStoreReviewScreenshot')
    if cur.get('data'): print('sub', sid, 'review shot exists'); continue
    if not SHOTS: print('no screenshots yet for sub review'); continue
    r=asc.upload_asset('/v1/subscriptionAppStoreReviewScreenshots',{'data':{'type':'subscriptionAppStoreReviewScreenshots','attributes':{'fileName':'01_paywall.png'},'relationships':{'subscription':{'data':{'type':'subscriptions','id':sid}}}}},SHOTS[-1],'subscriptionAppStoreReviewScreenshots')
    print('sub', sid, 'review shot', 'ok' if 'data' in r else json.dumps(r)[:300])
time.sleep(2)
for sid in SUBS: print('sub state', asc.api('GET',f'/v1/subscriptions/{sid}?fields[subscriptions]=name,state')['data']['attributes'])
print('DONE')
