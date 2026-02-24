FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["PersonalPodcast/PersonalPodcast.csproj", "PersonalPodcast/"]
RUN dotnet restore "PersonalPodcast/PersonalPodcast.csproj"

COPY . .
WORKDIR "/src/PersonalPodcast"

RUN dotnet publish "PersonalPodcast.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "PersonalPodcast.dll"]
