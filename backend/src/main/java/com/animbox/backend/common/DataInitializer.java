package com.animbox.backend.common;

import com.animbox.backend.auth.model.Role;
import com.animbox.backend.auth.model.User;
import com.animbox.backend.auth.repository.UserRepository;
import com.animbox.backend.games.common.model.GameSet;
import com.animbox.backend.games.common.model.GameType;
import com.animbox.backend.games.common.repository.GameSetRepository;
import com.animbox.backend.games.common.repository.GameTypeRepository;
import com.animbox.backend.games.familyfeud.model.FamilyFeudAnswer;
import com.animbox.backend.games.familyfeud.model.FamilyFeudQuestion;
import com.animbox.backend.games.familyfeud.repository.FamilyFeudQuestionRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class DataInitializer implements ApplicationRunner {

    private final GameTypeRepository gameTypeRepository;
    private final GameSetRepository gameSetRepository;
    private final FamilyFeudQuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(GameTypeRepository gameTypeRepository,
                           GameSetRepository gameSetRepository,
                           FamilyFeudQuestionRepository questionRepository,
                           UserRepository userRepository,
                           PasswordEncoder passwordEncoder) {
        this.gameTypeRepository = gameTypeRepository;
        this.gameSetRepository = gameSetRepository;
        this.questionRepository = questionRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        GameType familyFeudType = seedGameType(
                "FAMILY_FEUD",
                "Une Famille en Or",
                "Jeu de culture générale en équipe inspiré de Famille en Or.",
                12
        );

        if (gameSetRepository.countByIsPublicTrue() == 0) {
            User system = getOrCreateSystemUser();
            seedPresets(familyFeudType, system);
        }
    }

    private User getOrCreateSystemUser() {
        return userRepository.findByEmail("system@animbox.fr").orElseGet(() -> {
            User u = User.builder()
                    .email("system@animbox.fr")
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.ADMIN)
                    .emailVerified(true)
                    .build();
            return userRepository.save(u);
        });
    }

    private void seedPresets(GameType type, User owner) {
        createGameSet("Culture Générale", type, owner, List.of(
            q(type, "Citez un pays européen très visité par les touristes",
                a("France", 1, 35), a("Italie", 2, 25), a("Espagne", 3, 20), a("Grèce", 4, 12), a("Angleterre", 5, 8)),
            q(type, "Citez un animal qu'on trouve en Afrique",
                a("Éléphant", 1, 35), a("Lion", 2, 25), a("Girafe", 3, 20), a("Zèbre", 4, 12), a("Hippopotame", 5, 8)),
            q(type, "Citez un monument parisien célèbre",
                a("Tour Eiffel", 1, 45), a("Musée du Louvre", 2, 25), a("Arc de Triomphe", 3, 15), a("Notre-Dame", 4, 10), a("Sacré-Cœur", 5, 5)),
            q(type, "Citez une langue parlée dans le monde",
                a("Anglais", 1, 35), a("Espagnol", 2, 25), a("Mandarin", 3, 20), a("Arabe", 4, 12), a("Français", 5, 8)),
            q(type, "Citez un pays producteur de vin réputé",
                a("France", 1, 40), a("Italie", 2, 25), a("Espagne", 3, 18), a("Australie", 4, 10), a("Argentine", 5, 7)),
            q(type, "Citez un animal domestique populaire",
                a("Chien", 1, 45), a("Chat", 2, 35), a("Lapin", 3, 10), a("Hamster", 4, 7), a("Poisson rouge", 5, 3)),
            q(type, "Citez un moyen de transport",
                a("Avion", 1, 28), a("Voiture", 2, 27), a("Train", 3, 22), a("Bateau", 4, 13), a("Vélo", 5, 10)),
            q(type, "Citez une planète du système solaire",
                a("Mars", 1, 32), a("Jupiter", 2, 22), a("Saturne", 3, 20), a("Terre", 4, 16), a("Vénus", 5, 10)),
            q(type, "Citez un pays d'Amérique du Sud",
                a("Brésil", 1, 40), a("Argentine", 2, 28), a("Colombie", 3, 16), a("Chili", 4, 10), a("Pérou", 5, 6)),
            q(type, "Citez quelque chose qu'on fait le matin au réveil",
                a("Prendre une douche", 1, 35), a("Boire un café", 2, 28), a("Se brosser les dents", 3, 20), a("Petit déjeuner", 4, 12), a("S'habiller", 5, 5)),
            q(type, "Citez un instrument de musique à cordes",
                a("Guitare", 1, 40), a("Piano", 2, 25), a("Violon", 3, 20), a("Basse", 4, 10), a("Ukulélé", 5, 5)),
            q(type, "Citez un fruit consommé souvent",
                a("Pomme", 1, 30), a("Banane", 2, 28), a("Orange", 3, 22), a("Fraise", 4, 12), a("Raisin", 5, 8))
        ));

        createGameSet("Cinéma & Pop Culture", type, owner, List.of(
            q(type, "Citez un film de super-héros populaire",
                a("Avengers", 1, 32), a("Spider-Man", 2, 26), a("Batman", 3, 20), a("Superman", 4, 14), a("Black Panther", 5, 8)),
            q(type, "Citez une série Netflix populaire",
                a("Stranger Things", 1, 35), a("La Casa de Papel", 2, 25), a("Squid Game", 3, 20), a("Dark", 4, 12), a("Lupin", 5, 8)),
            q(type, "Citez un personnage de Disney célèbre",
                a("Mickey Mouse", 1, 30), a("Simba", 2, 26), a("Elsa", 3, 22), a("Cendrillon", 4, 14), a("Dumbo", 5, 8)),
            q(type, "Citez un acteur hollywoodien",
                a("Brad Pitt", 1, 26), a("Leonardo DiCaprio", 2, 24), a("Tom Hanks", 3, 22), a("Tom Cruise", 4, 18), a("Will Smith", 5, 10)),
            q(type, "Citez une comédie française culte",
                a("Intouchables", 1, 35), a("Bienvenue chez les Ch'tis", 2, 28), a("Le Dîner de Cons", 3, 20), a("La Vérité si je mens", 4, 12), a("Les Visiteurs", 5, 5)),
            q(type, "Citez un personnage de Star Wars",
                a("Dark Vador", 1, 42), a("Luke Skywalker", 2, 26), a("Yoda", 3, 20), a("Han Solo", 4, 8), a("Obi-Wan Kenobi", 5, 4)),
            q(type, "Citez un film d'animation",
                a("Toy Story", 1, 30), a("Le Roi Lion", 2, 27), a("Shrek", 3, 22), a("Nemo", 4, 13), a("Cars", 5, 8)),
            q(type, "Citez un groupe de musique célèbre",
                a("The Beatles", 1, 35), a("ABBA", 2, 25), a("Queen", 3, 22), a("AC/DC", 4, 12), a("Coldplay", 5, 6)),
            q(type, "Citez un réseau social populaire",
                a("Instagram", 1, 32), a("Facebook", 2, 28), a("TikTok", 3, 22), a("YouTube", 4, 12), a("Snapchat", 5, 6)),
            q(type, "Citez un personnage de dessin animé des années 90",
                a("Bugs Bunny", 1, 28), a("Goku", 2, 26), a("Pikachu", 3, 24), a("Bart Simpson", 4, 14), a("Sailor Moon", 5, 8)),
            q(type, "Citez un artiste musical français",
                a("David Guetta", 1, 28), a("Stromae", 2, 26), a("Aya Nakamura", 3, 22), a("MC Solaar", 4, 14), a("Daft Punk", 5, 10)),
            q(type, "Citez un jeu vidéo très populaire",
                a("Minecraft", 1, 28), a("FIFA", 2, 25), a("GTA", 3, 22), a("Mario Kart", 4, 15), a("Fortnite", 5, 10))
        ));

        createGameSet("Sports & Jeux", type, owner, List.of(
            q(type, "Citez un sport olympique",
                a("Natation", 1, 30), a("Athlétisme", 2, 26), a("Cyclisme", 3, 20), a("Judo", 4, 14), a("Escrime", 5, 10)),
            q(type, "Citez un joueur de football mondialement connu",
                a("Lionel Messi", 1, 35), a("Cristiano Ronaldo", 2, 32), a("Kylian Mbappé", 3, 18), a("Neymar", 4, 10), a("Zinédine Zidane", 5, 5)),
            q(type, "Citez un jeu de plateau populaire",
                a("Monopoly", 1, 38), a("Scrabble", 2, 26), a("Risk", 3, 18), a("Cluedo", 4, 12), a("Trivial Pursuit", 5, 6)),
            q(type, "Citez un sport d'hiver",
                a("Ski alpin", 1, 42), a("Snowboard", 2, 26), a("Patinage sur glace", 3, 18), a("Hockey sur glace", 4, 10), a("Biathlon", 5, 4)),
            q(type, "Citez un pays champion du monde de football",
                a("Brésil", 1, 30), a("Allemagne", 2, 24), a("France", 3, 22), a("Argentine", 4, 16), a("Italie", 5, 8)),
            q(type, "Citez un sport avec une raquette",
                a("Tennis", 1, 40), a("Badminton", 2, 26), a("Squash", 3, 18), a("Ping-pong", 4, 12), a("Padel", 5, 4)),
            q(type, "Citez un joueur de tennis célèbre",
                a("Rafael Nadal", 1, 30), a("Roger Federer", 2, 28), a("Novak Djokovic", 3, 24), a("Serena Williams", 4, 12), a("Andy Murray", 5, 6)),
            q(type, "Citez un jeu de cartes",
                a("Poker", 1, 36), a("Belote", 2, 26), a("Rami", 3, 20), a("Uno", 4, 12), a("Bataille", 5, 6)),
            q(type, "Citez un sport pratiqué en équipe",
                a("Football", 1, 36), a("Basketball", 2, 24), a("Rugby", 3, 18), a("Volleyball", 4, 14), a("Hockey", 5, 8)),
            q(type, "Citez une compétition sportive internationale",
                a("Jeux Olympiques", 1, 38), a("Coupe du Monde de Football", 2, 28), a("Roland Garros", 3, 16), a("Tour de France", 4, 12), a("Wimbledon", 5, 6)),
            q(type, "Citez un sport pratiqué en eau",
                a("Natation", 1, 38), a("Surf", 2, 24), a("Plongée", 3, 18), a("Kayak", 4, 12), a("Water-polo", 5, 8)),
            q(type, "Citez une discipline d'athlétisme",
                a("100 mètres", 1, 35), a("Marathon", 2, 25), a("Saut en hauteur", 3, 20), a("Lancer du javelot", 4, 12), a("Décathlon", 5, 8))
        ));

        createGameSet("Food & Lifestyle", type, owner, List.of(
            q(type, "Citez un plat typiquement français",
                a("Bœuf bourguignon", 1, 30), a("Quiche lorraine", 2, 26), a("Ratatouille", 3, 22), a("Bouillabaisse", 4, 14), a("Cassoulet", 5, 8)),
            q(type, "Citez une marque de fast-food connue",
                a("McDonald's", 1, 44), a("KFC", 2, 24), a("Burger King", 3, 18), a("Subway", 4, 10), a("Five Guys", 5, 4)),
            q(type, "Citez un fromage français",
                a("Camembert", 1, 36), a("Brie", 2, 26), a("Roquefort", 3, 20), a("Comté", 4, 12), a("Reblochon", 5, 6)),
            q(type, "Citez un dessert français",
                a("Crème brûlée", 1, 32), a("Mousse au chocolat", 2, 26), a("Tarte Tatin", 3, 20), a("Éclair au chocolat", 4, 14), a("Macaron", 5, 8)),
            q(type, "Citez un légume populaire",
                a("Tomate", 1, 32), a("Carotte", 2, 26), a("Pomme de terre", 3, 22), a("Courgette", 4, 12), a("Brocoli", 5, 8)),
            q(type, "Citez un cocktail connu",
                a("Mojito", 1, 34), a("Margarita", 2, 24), a("Cosmopolitan", 3, 20), a("Pina Colada", 4, 14), a("Daiquiri", 5, 8)),
            q(type, "Citez une application de streaming musical",
                a("Spotify", 1, 42), a("Apple Music", 2, 24), a("Deezer", 3, 18), a("SoundCloud", 4, 10), a("YouTube Music", 5, 6)),
            q(type, "Citez un geste du quotidien pour l'environnement",
                a("Trier ses déchets", 1, 36), a("Prendre le vélo", 2, 26), a("Économiser l'eau", 3, 20), a("Acheter local", 4, 12), a("Éteindre les lumières", 5, 6)),
            q(type, "Citez une marque de luxe",
                a("Chanel", 1, 30), a("Louis Vuitton", 2, 28), a("Hermès", 3, 22), a("Dior", 4, 14), a("Cartier", 5, 6)),
            q(type, "Citez une boisson consommée le matin",
                a("Café", 1, 42), a("Thé", 2, 26), a("Jus d'orange", 3, 18), a("Chocolat chaud", 4, 10), a("Lait", 5, 4)),
            q(type, "Citez un type de cuisine du monde",
                a("Italienne", 1, 28), a("Japonaise", 2, 26), a("Mexicaine", 3, 22), a("Chinoise", 4, 16), a("Indienne", 5, 8)),
            q(type, "Citez une épice utilisée en cuisine",
                a("Poivre", 1, 35), a("Curcuma", 2, 25), a("Cannelle", 3, 20), a("Paprika", 4, 12), a("Cumin", 5, 8))
        ));
    }

    private void createGameSet(String name, GameType type, User owner, List<FamilyFeudQuestion> questions) {
        List<FamilyFeudQuestion> saved = questionRepository.saveAll(questions);
        GameSet gs = new GameSet(name, type, owner, true);
        gs.setQuestions(saved);
        gameSetRepository.save(gs);
    }

    private FamilyFeudQuestion q(GameType type, String text, FamilyFeudAnswer... answers) {
        FamilyFeudQuestion q = new FamilyFeudQuestion(type, text, null);
        List<FamilyFeudAnswer> list = new ArrayList<>();
        for (FamilyFeudAnswer a : answers) {
            list.add(new FamilyFeudAnswer(q, a.getText(), a.getRank(), a.getScore()));
        }
        q.replaceAnswers(list);
        return q;
    }

    private FamilyFeudAnswer a(String text, int rank, int score) {
        // Placeholder answer — question will be set properly in q()
        return new FamilyFeudAnswer(null, text, rank, score);
    }

    private GameType seedGameType(String code, String name, String description, int maxPlayers) {
        return gameTypeRepository.findByCode(code).orElseGet(() ->
                gameTypeRepository.save(new GameType(code, name, description, maxPlayers))
        );
    }
}
