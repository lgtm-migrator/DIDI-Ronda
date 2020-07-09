import React from "react";
import { FlatList } from "react-native";
import Item from "./Item";

const ContactList = props => {
  const { contactList, pressHandler } = props;

  return (
    <FlatList
      data={contactList}
      renderItem={({ item }) => (
        <Item contact={item} pressHandler={() => pressHandler(item)} />
      )}
      keyExtractor={data => `contact-${data.recordID}`}
    />
  );
};

export default ContactList;
