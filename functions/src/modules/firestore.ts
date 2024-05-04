import { AppOptions, cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const { NODE_ENV } = process.env;

const options: AppOptions = {};

// 개발 시 설정
if (NODE_ENV === "development") {
  options.credential = cert(require("../mound-ad8f1-firebase-adminsdk-ldcob-4f39e87030.json"));
}

initializeApp();

const db = getFirestore();

export default (): FirebaseFirestore.Firestore => db;
