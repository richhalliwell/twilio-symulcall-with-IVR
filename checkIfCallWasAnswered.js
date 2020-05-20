/**
 *   end this call
 *   see if the call was answered
 *   text if it wasn't!
 */
async function endThisCall(context, event){
    const client = context.getTwilioClient();
    await client.calls(event.CallSidEndingConference)
      .update({status: 'completed'})
}

async function endAllMadeCalls(context, madeCalls){
    const client = context.getTwilioClient();

    for (const madeCall of madeCalls){
        await client.calls(madeCall.data.sid)
          .update({status: 'completed'})
    }
}

async function textToNotifyNoOnePickedUp(context,madeCalls){
    const client = context.getTwilioClient();
        for(const madeCall of madeCalls){
        await client.messages.create({
            to:madeCall.data.number,
            from:context.SMS_SENDER_NAME,
            body: 'NO ONE PICKED UP!'});
    }
}

async function callNotAnswered(madeCalls){
   return ! madeCalls.some((element)=>element.data.hasAnswered);
}
 
async function checkIfCallWasAnsweredAndEndCall(context, event){
    const callerSid = event.callerSid;
    const syncListId = event.syncListId
    
    const sync = Runtime.getSync();
    const madeCalls  = await sync.syncLists(syncListId).syncListItems.list();
    const notAnswered = await callNotAnswered(madeCalls)

    if(notAnswered)
        await textToNotifyNoOnePickedUp(context, madeCalls);
  
    await endAllMadeCalls(context, madeCalls);
    
    await endThisCall(context, event);

    return;
}

exports.handler = function(context, event, callback) {
    checkIfCallWasAnsweredAndEndCall(context,event).then(()=> callback()).catch(error => callback(error));
};
