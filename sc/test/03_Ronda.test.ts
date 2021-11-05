import BN from "bn.js";
import {
  RondaInstance,
  AddParticipantsToRonda,
  AddParticipantToRonda,
  AcceptParticipantToRonda,
  RejectParticipantToRonda,
  AcceptInvitationByAdmin,
  RejectInvitationByAdmin,
  ReplaceParticipant,
  DeletedPayment,
  AdminChanged,
  MakeCharge
} from "./../types/truffle-contracts/Ronda.d";
import { RondasRegistryInstance } from "./../types/truffle-contracts/RondasRegistry.d";
/* eslint-env node, mocha */
const RondasRegistry = artifacts.require("RondasRegistry");
const Ronda = artifacts.require("Ronda");
const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
require("chai")
  .use(require("chai-as-promised"))
  .should();

const PENDING = new BN(0);
const ACCEPTED = new BN(1);
const REJECTED = new BN(2);
const zero = new BN(0);
const one = new BN(1);
const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const assertEqualBN = (bn1: BN, bn2: BN) => assert.isTrue(bn1.eq(bn2));
const assertNotEqualBN = (bn1: BN, bn2: BN) => assert.isFalse(bn1.eq(bn2));

type SolidityError = {
  message: string;
};

const getNewRonda = async (
  rondasRegistry: RondasRegistryInstance,
  admin: string,
  id: string
) => {
  await rondasRegistry.newRonda(id, admin);
  const { 1: address } = await rondasRegistry.getRondaById(id);
  assert.notEqual(address, ZERO_ADDR);

  const rondaExists = await rondasRegistry.rondaExists(id);
  assert.equal(rondaExists, true);
  return Ronda.at(address);
};

contract("Ronda", ([_owner, admin, other, ...participants]) => {
  let rondasRegistry: RondasRegistryInstance;
  let ronda: RondaInstance;
  let rondaId = 0;
  const fromAdmin = { from: admin };
  before(async () => {
    rondasRegistry = await RondasRegistry.deployed();
  });

  beforeEach(async () => {
    rondaId++;
    ronda = await getNewRonda(rondasRegistry, admin, `${rondaId}`);
  });

  it("Expect isAdmin to be true using admin account", async () => {
    const isAdmin = await ronda.isAdmin({ from: admin });
    assert.equal(isAdmin, true);
  });

  it("Expect isAdmin to be false using a non admin account", async () => {
    const isAdmin = await ronda.isAdmin({ from: other });
    assert.equal(isAdmin, false);
  });
  it("Get Participant should return 0x0", async () => {
    const {
      0: participantAddress,
      1: acceptedMoment,
      2: state,
      3: madeBy,
      4: exists
    } = await ronda.getParticipant(participants[0], { from: admin });
    assert.equal(participantAddress, ZERO_ADDR);
    assertEqualBN(acceptedMoment, zero);
    assertEqualBN(state, PENDING);
    assert.equal(madeBy, ZERO_ADDR);
    assert.equal(exists, false);
  });

  it("Add participant in pending state", async () => {
    const added = await ronda.addParticipant(participants[0], { from: admin });
    const {
      0: participantAddress,
      1: acceptedMoment,
      2: state,
      3: madeBy,
      4: exists
    } = await ronda.getParticipant(participants[0], { from: admin });

    assert.equal(participantAddress, participants[0]);
    assertEqualBN(acceptedMoment, zero);
    assertEqualBN(state, PENDING);
    assert.equal(madeBy, ZERO_ADDR);
    assert.equal(exists, true);
    const eventData: AddParticipantToRonda = {
      args: {
        _admin: admin,
        _participant: participants[0],
        0: admin,
        1: participants[0]
      },
      name: "AddParticipantToRonda"
    };
    expectEvent(added, eventData.name, eventData.args);
  });

  it("Add participant. Expect to fail for same address", async () => {
    await ronda.addParticipant(participants[0], { from: admin });
    await expectRevert(
      ronda.addParticipant(participants[0], { from: admin }),
      "The participant is already present on the round"
    );
  });

  it("Add participants", async () => {
    const added = await ronda.addParticipants(participants, { from: admin });

    participants.forEach(async address => {
      const participantExists = await ronda.participantExists(address, {
        from: admin
      });
      assert.equal(participantExists, true);

      const participantIsPending = await ronda.participantStateIsPending(
        address,
        { from: admin }
      );
      assert.equal(participantIsPending, true);

      const {
        0: participantAddress,
        1: acceptedMoment,
        2: state,
        3: madeBy,
        4: exists
      } = await ronda.getParticipant(address, { from: admin });

      assert.equal(address, participantAddress);
      assertEqualBN(acceptedMoment, zero);
      assertEqualBN(state, PENDING);
      assert.equal(madeBy, ZERO_ADDR);
      assert.equal(exists, true);
    });
    const addedEvent: AddParticipantsToRonda = {
      name: "AddParticipantsToRonda",
      args: {
        _admin: admin,
        _participants: participants,
        0: admin,
        1: participants
      }
    }
    expectEvent(added.receipt, addedEvent.name, addedEvent.args)
  });

  it("Add participants. Should not fail for duplicated address", async () => {
    const allParticipants = [...participants, participants[0]];
    const added = await ronda.addParticipants(allParticipants, {
      from: admin
    });

    participants.forEach(async address => {
      const participantExists = await ronda.participantExists(address, {
        from: admin
      });
      assert.equal(participantExists, true);

      const participantIsPending = await ronda.participantStateIsPending(
        address,
        { from: admin }
      );
      assert.equal(participantIsPending, true);

      const {
        0: participantAddress,
        1: acceptedMoment,
        2: state,
        3: madeBy,
        4: exists
      } = await ronda.getParticipant(address, { from: admin });

      assert.equal(address, participantAddress);
      assertEqualBN(acceptedMoment, zero);
      assertEqualBN(state, PENDING);
      assert.equal(madeBy, ZERO_ADDR);
      assert.equal(exists, true);
    });
    const addedEvent: AddParticipantsToRonda = {
      name: "AddParticipantsToRonda",
      args: {
        _admin: admin,
        _participants: allParticipants,
        0: admin,
        1: allParticipants
      }
    }
    expectEvent(added.receipt, addedEvent.name, addedEvent.args)

  });

  it("Add participants. Should not fail for duplicated address", async () => {
    const allParticipants = [...participants, participants[0]];
    const added = await ronda.addParticipants(allParticipants, {
      from: admin
    });

    participants.forEach(async address => {
      const participantExists = await ronda.participantExists(address, {
        from: admin
      });
      assert.equal(participantExists, true);

      const participantIsPending = await ronda.participantStateIsPending(
        address,
        { from: admin }
      );
      assert.equal(participantIsPending, true);

      const {
        0: participantAddress,
        1: acceptedMoment,
        2: state,
        3: madeBy,
        4: exists
      } = await ronda.getParticipant(address, { from: admin });

      assert.equal(address, participantAddress);
      assertEqualBN(acceptedMoment, zero);
      assertEqualBN(state, PENDING);
      assert.equal(madeBy, ZERO_ADDR);
      assert.equal(exists, true);
      expectEvent;
    });
    const addedEvent: AddParticipantsToRonda = {
      name: "AddParticipantsToRonda",
      args: {
        _admin: admin,
        _participants: allParticipants,
        0: admin,
        1: allParticipants
      }
    }
    expectEvent(added.receipt, addedEvent.name, addedEvent.args)
  });

  it("Participant accepts invitation", async () => {
    const participant = participants[0];
    await ronda.addParticipant(participant, { from: admin });

   const accept = await ronda.acceptInvitationToParticipate({ from: participant });

    const {
      0: participantAddress,
      1: acceptedMoment,
      2: state,
      3: madeBy,
      4: exists
    } = await ronda.getParticipant(participant, { from: admin });

    assert.equal(participantAddress, participant);
    assertNotEqualBN(acceptedMoment, zero);
    assertEqualBN(state, ACCEPTED);
    assert.equal(madeBy, participant);
    assert.equal(exists, true);

    const eventData: AcceptParticipantToRonda = {
      name: "AcceptParticipantToRonda",
      args: {
        _admin: admin,
        _participant: participant,
        0: admin,
        1: participant
      }
    }
    expectEvent(accept.receipt, eventData.name, eventData.args)
  });

  it("Participant should exist before accept", async () => {
    const participant = participants[0];
    await expectRevert(
      ronda.acceptInvitationToParticipate({ from: participant }),
      "The participant doesn't exists"
    );
  });

  it("Participant should not accept invitation more than one time", async () => {
    const participant = participants[0];
    await ronda.addParticipant(participant, { from: admin });

    await ronda.acceptInvitationToParticipate({ from: participant });
    await expectRevert(
      ronda.acceptInvitationToParticipate({ from: participant }),
      "The participant state must be pending"
    );
  });

  it("Participant reject invitation", async () => {
    const participant = participants[0];
    await ronda.addParticipant(participant, { from: admin });

    const rejection = await ronda.rejectInvitationToParticipate({ from: participant });

    const {
      0: participantAddress,
      1: acceptedMoment,
      2: state,
      3: madeBy,
      4: exists
    } = await ronda.getParticipant(participant, { from: admin });

    assert.equal(participantAddress, participant);
    assertNotEqualBN(acceptedMoment, zero);
    assertEqualBN(state, REJECTED);
    assert.equal(madeBy, participant);
    assert.equal(exists, true);
    const eventData: RejectParticipantToRonda = {
      name: "RejectParticipantToRonda",
      args: {
        _admin: admin,
        _participant: participant,
        0: admin,
        1: participant
      }
    }
    expectEvent(rejection.receipt, eventData.name, eventData.args)

  });

  it("Participant should exist before reject", async () => {
    const participant = participants[0];
    await expectRevert(
      ronda.rejectInvitationToParticipate({ from: participant }),
      "The participant doesn't exists"
    );
  });

  it("Participant should not reject invitation more than one time", async () => {
    const participant = participants[0];
    await ronda.addParticipant(participant, { from: admin });

    await ronda.rejectInvitationToParticipate({ from: participant });
    await expectRevert(
      ronda.rejectInvitationToParticipate({ from: participant }),
      "The participant state must be pending"
    );
  });

  it("Participant accepts invitation by admin", async () => {
    const participant = participants[0];
    await ronda.addParticipant(participant, { from: admin });

   const adminAccept =  await ronda.acceptInvitationByAdmin(participant, { from: admin });

    const {
      0: participantAddress,
      1: acceptedMoment,
      2: state,
      3: madeBy,
      4: exists
    } = await ronda.getParticipant(participant, { from: admin });

    assert.equal(participantAddress, participant);
    assertNotEqualBN(acceptedMoment, zero);
    assertEqualBN(state, ACCEPTED);
    assert.equal(madeBy, admin);
    assert.equal(exists, true);
    const eventData: AcceptInvitationByAdmin = {
      name: "AcceptInvitationByAdmin",
      args: {
        _admin: admin,
        _participant: participant,
        _blockNumber: new BN(adminAccept.receipt.blockNumber),
        0: admin,
        1: participant,
        2: new BN(adminAccept.receipt.blockNumber)
      }
    };
    expectEvent(adminAccept.receipt, eventData.name, eventData.args);

  });

  it("Participant should exist before accept by admin", async () => {
    const participant = participants[0];
    await expectRevert(
      ronda.acceptInvitationByAdmin(participant, { from: admin }),
      "The participant doesn't exists"
    );
  });

  it("Participant should not accept by admin more than one time", async () => {
    const participant = participants[0];
    await ronda.addParticipant(participant, { from: admin });

    await ronda.acceptInvitationByAdmin(participant, { from: admin });
    await expectRevert(
      ronda.acceptInvitationByAdmin(participant, { from: admin }),
      "The participant state must be pending"
    );
  });

  it("Participant reject invitation by admin", async () => {
    const participant = participants[0];
    await ronda.addParticipant(participant, { from: admin });

    const adminRejection = await ronda.rejectInvitationByAdmin(participant, { from: admin });

    const {
      0: participantAddress,
      1: acceptedMoment,
      2: state,
      3: madeBy,
      4: exists
    } = await ronda.getParticipant(participant, { from: admin });

    assert.equal(participantAddress, participant);
    assertNotEqualBN(acceptedMoment, zero);
    assertEqualBN(state, REJECTED);
    assert.equal(madeBy, admin);
    assert.equal(exists, true);
    const eventData: RejectInvitationByAdmin = {
      name: "RejectInvitationByAdmin",
      args: {
        _admin: admin,
        _participant: participant,
        _blockNumber: new BN(adminRejection.receipt.blockNumber),
        0: admin,
        1: participant,
        2: new BN(adminRejection.receipt.blockNumber)
      }
    };
    expectEvent(adminRejection.receipt, eventData.name, eventData.args);
  });

  it("Participant should exist before reject by admin", async () => {
    const participant = participants[0];
    await expectRevert(
      ronda.rejectInvitationByAdmin(participant, { from: admin }),
      "The participant doesn't exists"
    );
  });

  it("Participant should not reject by admin more than one time", async () => {
    const participant = participants[0];
    await ronda.addParticipant(participant, { from: admin });

    await ronda.rejectInvitationByAdmin(participant, { from: admin });
    await expectRevert(
      ronda.rejectInvitationByAdmin(participant, { from: admin }),
      "The participant state must be pending"
    );
  });

  it("Participant replacement should replace data correctly", async () => {
    const participant = participants[0];
    const newParticipant = participants[1];
    await ronda.addParticipant(participant, { from: admin });
    const replaced = await ronda.replaceParticipant(participant, newParticipant, {
      from: admin
    });
    const {
      0: participantAddress,
      1: acceptedMoment,
      2: state,
      3: madeBy,
      4: exists
    } = await ronda.getParticipant(newParticipant, { from: admin });
    const {
      0: oldParticipantAddress,
      1: oldAcceptedMoment,
      2: oldState,
      3: oldMadeBy,
      4: oldExists
    } = await ronda.getParticipant(participant, { from: admin });
    assert.isFalse(oldExists);
    assert.isTrue(exists);
    assert.equal(participantAddress, newParticipant);
    assertEqualBN(acceptedMoment, zero);
    const eventData: ReplaceParticipant = {
      name: "ReplaceParticipant",
      args: {
        admin: admin,
        _oldParticipant: participant,
        _newParticipant: newParticipant,
        0: admin,
        1: participant,
        2: newParticipant
      }
    };
    expectEvent(replaced.receipt, eventData.name, eventData.args);
  });

  it("Participant replacement should not replace already existing participant", async () => {
    const participant = participants[0];
    const newParticipant = participants[1];
    await ronda.addParticipant(participant, { from: admin });
    await ronda.replaceParticipant(participant, newParticipant, {
      from: admin
    });
    const {
      0: participantAddress,
      1: acceptedMoment,
      2: state,
      3: madeBy,
      4: exists
    } = await ronda.getParticipant(newParticipant, { from: admin });
    const {
      0: oldParticipantAddress,
      1: oldAcceptedMoment,
      2: oldState,
      3: oldMadeBy,
      4: oldExists
    } = await ronda.getParticipant(participant, { from: admin });
    assert.isFalse(oldExists);
    assert.isTrue(exists);
    assert.equal(participantAddress, newParticipant);
    assertEqualBN(acceptedMoment, zero);
    try {
      await ronda.replaceParticipant(newParticipant, newParticipant, {
        from: admin
      });
    } catch (error: any) {
      assert.isTrue(
        error.message.includes("The participant already exists in the Ronda")
      );
    }
  });

  it("Admin should be able to delete a payment", async () => {
    const participant = participants[0];
    await ronda.addParticipant(participant, fromAdmin);
    await ronda.makePayment("1", { from: participant });
    const payments = await ronda.getQuantityOfPayments(fromAdmin);
    assertEqualBN(payments, new BN(1));

    const {
      0: p1_participant,
      1: p1_doneMoment,
      2: p1_amount,
      3: p1_deleted,
      4: p1_deletedMoment
    } = await ronda.getPayment(payments, fromAdmin);
    const currBlock1 = await web3.eth.getBlockNumber();
    assert.equal(p1_participant, participant);
    assertEqualBN(p1_doneMoment, new BN(currBlock1));
    assertEqualBN(p1_amount, one);
    assert.isFalse(p1_deleted);
    assertEqualBN(p1_deletedMoment, zero);

    const deleted = await ronda.deletePayment(payments, fromAdmin);

    const {
      0: p2_participant,
      1: p2_doneMoment,
      2: p2_amount,
      3: p2_deleted,
      4: p2_deletedMoment
    } = await ronda.getPayment(payments, fromAdmin);
    const currBlock2 = await web3.eth.getBlockNumber();
    assert.equal(p2_participant, participant);
    assertEqualBN(p2_doneMoment, new BN(currBlock1));
    assertEqualBN(p2_amount, one);
    assert.isTrue(p2_deleted);
    assertEqualBN(p2_deletedMoment, new BN(currBlock2));

    const eventData: DeletedPayment = {
      name: "DeletedPayment",
      args: {
        number: one,
        timeMade: new BN(deleted.receipt.blockNumber),
        0: one,
        1: new BN(deleted.receipt.blockNumber),
      }
    }
    expectEvent(deleted.receipt, eventData.name, eventData.args);
  });

  it("Admin should be able to be changed", async () => {
    const participant = participants[0];
    const firstPayments = await ronda.getQuantityOfPayments(fromAdmin);
    assertEqualBN(firstPayments, zero);
    const changed = await ronda.changeAdmin(participant, fromAdmin);
    try {
      // This should throw, we want that behaviour
      await ronda.getQuantityOfPayments(fromAdmin);
    } catch (error: any) {
      // We assert that it threw an error that has the is not admin message
      assert.isTrue(error.message.includes("Is not admin!"));
    }
    const secondPayments = await ronda.getQuantityOfPayments({
      from: participant
    });
    assertEqualBN(secondPayments, zero);
    const eventData: AdminChanged = {
      name: "AdminChanged",
      args: {
        oldAdmin: fromAdmin.from,
        newAdmin: participant,
        0: fromAdmin.from,
        1: participant
      }
    }
    expectEvent(changed.receipt, eventData.name, eventData.args);
  });

  it("Should be able to store a charge", async () => {
    await ronda.addParticipant(admin, fromAdmin);
    const charge = await ronda.makeCharge(one, fromAdmin);

    const chargesCount = await ronda.getQuantityOfCharges(fromAdmin);
    const currBlock = await web3.eth.getBlockNumber();

    assertEqualBN(chargesCount, one);
    const {
      0: chargeParticipant,
      1: chargeConfirmedBy,
      2: chargeDoneMoment,
      3: chargeAmount
    } = await ronda.getCharge(chargesCount, fromAdmin);
    assert.equal(chargeParticipant, admin);
    assert.equal(chargeConfirmedBy, admin);
    assertEqualBN(chargeDoneMoment, new BN(currBlock));
    assertEqualBN(chargeAmount, one);
    const eventData: MakeCharge = {
      name: "MakeCharge",
      args: {
        _participant: fromAdmin.from,
        _confirmedBy: fromAdmin.from,
        _amount: one,
        _blockNumber: new BN(charge.receipt.blockNumber),
        0: fromAdmin.from,
        1: fromAdmin.from,
        2: one,
        3: new BN(charge.receipt.blockNumber)
      }
    }
    expectEvent(charge.receipt, eventData.name, eventData.args);
  });

  it("Admin should be able to start the round", async () => {
    await ronda.start(fromAdmin);
    const events = await ronda.getPastEvents("RondaStarted");
    assert.equal(events.length, 1);
    const currBlock = await web3.eth.getBlockNumber();
    const { _admin, _blockNumber } = events[0].returnValues;
    assert.equal(_admin, admin);
    assertEqualBN(new BN(_blockNumber), new BN(currBlock));
  });

  it("Admin should be able to replace a participant in an started round", async () => {
    const participant = participants[0];
    const participant2 = participants[1];

    await ronda.addParticipant(participant, fromAdmin);
    await ronda.start(fromAdmin);
    await ronda.replaceParticipant(participant, participant2, fromAdmin);
    const {
      0: participantAddress,
      1: acceptedMoment,
      2: state,
      3: madeBy,
      4: exists
    } = await ronda.getParticipant(participant2, fromAdmin);
    const currBlock = await web3.eth.getBlockNumber();
    assert.isTrue(exists);
    assert.equal(participantAddress, participant2);
    assert.equal(madeBy, admin);
    assertEqualBN(ACCEPTED, state);
    assertEqualBN(new BN(currBlock), acceptedMoment);
  });

  it("Admin should NOT be able to start the round twice", async () => {
    await ronda.start(fromAdmin);
    try {
      await ronda.start(fromAdmin);
    } catch (error) {
      const err = error as SolidityError;
      assert.isTrue(err.message.includes("The ronda is already started"));
    }
  });

  it("Admin should not be able to add participants to a finished Round", async () => {
    const rondaId = "90";
    await rondasRegistry.newRonda(rondaId, admin);
    const { 1: address } = await rondasRegistry.getRondaById(rondaId);
    assert.notEqual(address, ZERO_ADDR);

    const rondaExists = await rondasRegistry.rondaExists(rondaId);
    assert.equal(rondaExists, true);
    const ronda90 = await Ronda.at(address);
    await ronda90.addParticipant(participants[1], fromAdmin);
    await rondasRegistry.finishRonda(rondaId);
    const { 2: ronda90Active } = await rondasRegistry.getRondaById(rondaId);
    assert.isFalse(ronda90Active);
    try {
      await ronda.addParticipant(participants[2], fromAdmin);
    } catch (error: any) {
      const err = error as SolidityError;
      assert.isTrue(err.message.includes("Ronda is not active!"));
    }
  });
});
