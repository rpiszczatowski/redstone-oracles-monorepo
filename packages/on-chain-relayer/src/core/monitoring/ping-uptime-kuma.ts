import axios from "axios";
import { config } from "../../config";

export const pingUptimeKuma = async () => {
  const uptimeKumaUrl = config.uptimeKumaUrl;
  await axios.get(uptimeKumaUrl);
};
