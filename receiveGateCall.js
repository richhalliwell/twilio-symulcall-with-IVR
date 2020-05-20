/**
 * 
 * 
 * create new sync list (async)
 * make outgoing calls (pass the list id to the url)
 * add sid of each call to sync list * 
 * 
 * return twiml to put in conference and hold
 * 
 */
async function makeCallsAndList(context, event) {
    const twiml = new Twilio.twiml.VoiceResponse();
    
    const syncListId = await createSyncList();

	twiml.dial().conference({startConferenceOnEnter: false,
	                         endConferenceOnExit: true, 
	                         waitUrl:context.WAIT_MUSIC_URL,
	                         statusCallbackEvent:"end",
	                         statusCallback: 'https://' + context.DOMAIN_NAME + '/checkIfCallWasAnswered'
	                           + '?syncListId=' + syncListId
	}, context.SIMULCALL_CONFERENCE_NAME);
    

    const callsMade = await makeCalls(context, syncListId);
    await addCallsMadeToSyncList(callsMade, syncListId);
    return twiml;	
}

async function createSyncList() {
    const sync = Runtime.getSync();
    const secondsInDay = 86400;
    const { sid } = await sync.lists.create({'ttl':secondsInDay}); 

    return sid;
}
 
async function makeCalls(context, syncListId) {
    const residents = [
        {'name':'<<FRIENDLY NAME>>','number':<<+44 PHONENUMBER>>}
        /*List of numbers to call here...*/
        
    ];
    
    const callsMade = [];
    for (const resident of residents) {
        const sid = await makeCall(context, syncListId, resident);
        callsMade.push({sid:sid, number:resident.number});
    }
    return callsMade;
}

async function makeCall(context, syncListId, resident) {
    const client = context.getTwilioClient();
    const url = 'https://' + context.DOMAIN_NAME + '/humanDectectionIVR'
        + '?syncListId=' + syncListId 
        + '&answererName=' + encodeURIComponent(resident.name)
    const { sid } = await client.calls.create({
        url: url,
        to: resident.number,
        from: context.TWILIO_NUMBER,
    });

    return sid;
}

async function addCallsMadeToSyncList(callsMade, syncListId) {
    const sync = Runtime.getSync();
    const syncList = await sync.syncLists(syncListId);
    for (const callMade of callsMade) {
        await syncList.syncListItems.create({data:callMade});  
    }
}

exports.handler = function(context, event, callback) {
    makeCallsAndList(context, event).then(twiml => callback(null, twiml)).catch(error => callback(error));
}
