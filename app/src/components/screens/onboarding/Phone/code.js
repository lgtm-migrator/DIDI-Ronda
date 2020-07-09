import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Sae } from "react-native-textinput-effects";
import { Button } from "native-base";
import FontAwesomeIcon from "react-native-vector-icons/FontAwesome";
import colors from "../../../components/colors";

const Code = props => {
  const [code, setCode] = useState("");
  const { sentTo, error } = props;

  const sendCode = () => {
    props.sendCode(code);
  };
  const goBack = () => {
    props.back();
  };

  let subtitle = `Te enviamos un codigo a ${sentTo}, ponlo aqui`;

  if (error) {
    subtitle = "El codigo es incorrecto, intenta nuevamente";
  }
  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
      <View style={styles.formContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>La Ronda</Text>
          <Text
            style={[
              styles.subtitle,
              { width: 350, textAlign: "center", marginBottom: 30 },
            ]}
          >
            {subtitle}
          </Text>
          <Sae
            label="Codigo"
            value={code}
            onChangeText={setCode}
            iconClass={FontAwesomeIcon}
            iconName="lock"
            iconColor="white"
            inputPadding={16}
            labelHeight={24}
            borderHeight={2}
            style={{ width: "80%" }}
            autoCapitalize="none"
            autoCorrect={false}
            labelStyle={{ color: "white" }}
          />
          <Button
            onPress={sendCode}
            style={[
              styles.button,
              { width: 200, flexDirection: "row", justifyContent: "center" },
            ]}
          >
            <Text style={{ color: "black", textAlign: "center" }}>Enviar</Text>
          </Button>
          <TouchableOpacity
            onPress={goBack}
            style={[
              styles.button,
              {
                width: 200,
                backgroundColor: colors.mainBlue,
                flexDirection: "row",
                justifyContent: "center",
              },
            ]}
          >
            <Text style={{ color: "white", textAlign: "center" }}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.mainBlue,
  },
  formContainer: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    color: "white",
  },
  button: {
    marginTop: 30,
    backgroundColor: "white",
    borderRadius: 8,
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    color: "white",
    fontWeight: "bold",
  },
  subtitle: { color: "white", fontSize: 18 },
});

export default Code;
