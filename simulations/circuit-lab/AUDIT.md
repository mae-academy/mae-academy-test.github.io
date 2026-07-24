# ElectroLab Simulator — Audit de départ

## État du projet

Le projet est une application React 19/Vite/TypeScript avec un espace de travail SVG. La vérification TypeScript de la version fournie réussit après installation des dépendances.

## Constat fonctionnel

| Domaine | État initial | Conséquence |
|---|---|---|
| Solveur | Calcul de branches indépendant et affectation directe de tensions | Les lois de Kirchhoff, les charges, les circuits multi-nœuds et les appareils de mesure ne sont pas physiquement fiables. |
| Topologie | La page ne crée qu'une branche par composant en utilisant le premier et le dernier terminal | Les composants à 3+ bornes, les contacts multipôles, les relais et les moteurs triphasés sont simulés de manière incorrecte. |
| DMM et oscilloscope | Reçoivent des valeurs agrégées/synthétiques de la page | Ils ne mesurent ni les nœuds réels ni les sondes connectées. |
| Câblage | Création borne-à-borne et tracé automatique uniquement | Aucun modèle d'édition des segments, de sélection de fil ni de suppression ciblée. |
| Étiquettes | Le rendu montre le nom générique de la définition | Pas de repérage d'instance tel que R1, V1, L1. |
| Thème | La feuille de style fournit des variables claires mais la page force des couleurs sombres en ligne | Le thème clair n'est pas appliqué à l'espace de travail. |
| Contacteurs | Des bornes auxiliaires sont déclarées mais le solveur les ignore | Les circuits de commande classique ne peuvent pas fonctionner correctement. |
| Courant animé | Les points suivent un statut « alimenté » global | Le sens et l'existence du courant affiché ne correspondent pas nécessairement au résultat calculé. |

## Décision d'architecture

La mise à jour remplacera le calcul actuel par un solveur MNA transitoire pour le sous-ensemble électrique explicitement pris en charge dans l'interface : résistances, potentiomètres, sources DC/AC/3-phases, rails, interrupteurs, relais/contacteurs et contacts auxiliaires, lampes/LED, compteurs, condensateurs et inductances. Les appareils de mesure seront des objets de l'espace de travail avec des sondes reliées à des bornes réelles. Les cas hors modèle explicite afficheront un état non pris en charge plutôt que des chiffres arbitraires.

## Vérifications prévues

1. Diviseur de tension DC (valeurs analytiques).
2. Charge résistive sur source AC avec calcul RMS sur une fenêtre entière.
3. Réseau de contacts NO/NC et auto-maintien de contacteur.
4. Réseau triphasé équilibré et tensions phase-phase.
5. LED avec courant limité et couleur d'émission correspondante.
6. Mesure de tension, courant, résistance hors tension et forme d'onde par sondes.
7. Raccourcis de déplacement, presse-papiers, fils, texte et édition de chemin.
