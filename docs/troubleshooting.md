# Troubleshooting Guide

## 1. Kafka Connection Issues

### Symptom: `kafka_status: fallback_buffer`
- **Cause:** Native Apache Kafka broker on `localhost:9092` is not reachable.
- **Resolution:**
  - If running in Docker: ensure `docker compose up -d kafka` is healthy (`docker ps`).
  - If developing locally without Docker: the application seamlessly uses the built-in streaming simulation buffer. Replay, metrics, and storage will operate without crash.

## 2. Hadoop HDFS Connection Issues

### Symptom: `hdfs_status: fallback_local`
- **Cause:** Hadoop NameNode on `http://localhost:9870` or `hdfs://localhost:9000` is offline or in safemode.
- **Resolution:**
  - Check container status: `docker logs hadoop-namenode`.
  - Check NameNode safe mode:
    ```bash
    docker exec -it hadoop-namenode hdfs dfsadmin -safemode leave
    ```
  - While offline, all files are stored safely in `./data/energy/` using the exact same folder hierarchy.

## 3. Dataset Missing or Incomplete

### Symptom: `dataset_available: false`
- **Resolution:**
  - Run the automated downloader:
    ```bash
    python3 scripts/download_dataset.py
    ```
  - Or verify that `data/household_power_consumption_sample.txt` exists in the `data/` folder.
  - Or upload any UCI `.txt` file via the web dashboard at `GET /api/readings` -> "Upload Dataset".

## 4. Port Conflicts

- **Frontend:** Defaults to port `3000`. Set `PORT=3001` if already in use.
- **Backend API:** Defaults to port `8000` (FastAPI) or integrated with Vite dev server.
- **Kafka:** Uses `9092` (client) and `29092` (host listener).
- **HDFS Web UI:** NameNode web portal is at port `9870`. DataNode is at `9864`.
