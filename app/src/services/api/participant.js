import apiCall from "./helper";

export const getRoundData = async roundId => {
  try {
    return await apiCall("get", `/participant/round/${roundId}`);
  } catch (error) {
    return { error };
  }
};

export const acceptInvitation = async (idParticipant, roundId) => {
  try {
    return await apiCall(
      "post",
      `/participant/round/${roundId}/participant/${idParticipant}/accept`
    );
  } catch (error) {
    return { error };
  }
};

export const rejectInvitation = async (idParticipant, roundId) => {
  try {
    return await apiCall(
      "post",
      `/participant/round/${roundId}/participant/${idParticipant}/reject`
    );
  } catch (error) {
    return { error };
  }
};

export const requestNumbers = async (idParticipant, roundId, numbers) => {
  try {
    return await apiCall(
      "post",
      `/participant/round/${roundId}/participant/${idParticipant}/requestNumbers`,
      {
        numbers,
      }
    );
  } catch (error) {
    return { error };
  }
};

export const payRound = async (roundId, number, participant) => {
  try {
    return await apiCall(
      "post",
      `/participant/round/${roundId}/number/${number}/pay`,
      {
        participantId: participant,
      }
    );
  } catch (error) {
    return { error };
  }
};

export const chargeNumber = async (roundId, participantId, number) => {
  try {
    return await apiCall(
      "post",
      `/participant/round/${roundId}/number/${number}/charge`,
      {
        participantId,
      }
    );
  } catch (error) {
    return { error };
  }
};

export const requestPayment = async (roundId, participantId) => {
  try {
    return await apiCall(
      "post",
      `/participant/round/${roundId}/participant/${participantId}/requestPayment`,
      {
        participantId,
        roundId,
      }
    );
  } catch (error) {
    return { error };
  }
};
