# Personal Podcast – Local Setup (Docker Compose & Kubernetes)

## Parakushtet

- **Docker Desktop**

> Mos perdor komanda destruktive qe fshijne databazen, p.sh. `docker compose down -v` ose `kubectl delete pvc ...` pa u dakordu ekipi.

---

# A) Run me Docker Compose (opsioni me i lehte per local)

### 1) Krijo `.env` lokalisht (jo me commmit)
- Krijo nje file `.env` në root te projektit.
- Mbushi variablat sipas vlerave te ekipit (DB/Cloudinary, etj.).
- **Mos e shty** `.env` në GitHub.
- E kom shtu env example qysh e kom edhe une
---

### 2) Nise projektin
Komande **safe** (nuk fshin volumes/DB):
```bash
docker compose up -d --build
```

---

### 3) Kontrollo statusin
```bash
docker compose ps
```

- `Up / running` ✅ = mire  
- `Restarting` ❌ = shiko logs  
- `Exited` ❌ = container-i ka ndalu  

---

### 4) URL-t per testim
- Frontend: `http://localhost:3000`
- Backend Swagger: `http://localhost:8080/swagger`

---

### 5) Kur ndryshon `.env`
Ndryshimet merren vetem pas restart/recreate:
```bash
docker compose up -d --force-recreate
```

---

### 6) Si me e ndale
```bash
docker compose down
```
---

# B) Run me Kubernetes (k8s) local (per testim si ne AKS)

> Ketu `.env` nuk perdoret. Kubernetes i merr konfigurimet prej **Secret n'folder k8s**.

### 1) Apliko manifests -- mos harro me mbushe secret me vlerat tona
```bash
kubectl apply -f k8s/
```

Kontrollo:
```bash
kubectl -n personalpodcast get pods
kubectl -n personalpodcast get svc
```
#### Mos i bon commit vlerat n'secret nese e provon

---

### 4) Test me port-forward (rekomandohet)
Perdor porta te ndryshme qe mos me u ngaterru me Docker:

**API**
```bash
kubectl -n personalpodcast port-forward svc/api 18080:8080
```

**Frontend**
```bash
kubectl -n personalpodcast port-forward svc/web 13000:80
```

Pastaj:
- API Swagger: `http://localhost:18080/swagger`
- Frontend: `http://localhost:13000`

---

## Qysh me e dallu a je me Docker apo me Kubernetes

- **Docker Compose**
  - FE: `localhost:3000`
  - API: `localhost:8080`

- **Kubernetes port-forward**
  - FE: `localhost:13000`
  - API: `localhost:18080`