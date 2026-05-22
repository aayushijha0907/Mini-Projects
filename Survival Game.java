import javax.swing.*;
import java.awt.*;
import java.awt.event.*;
import java.util.ArrayList;
import java.util.Random;

public class SurvivalGame extends JPanel implements ActionListener, KeyListener {

    // Player
    int playerX = 350;
    int playerY = 250;
    int playerSize = 40;
    int speed = 10;

    // Score
    int score = 0;

    // Timer
    Timer timer;

    // Enemy List
    ArrayList<Rectangle> enemies = new ArrayList<>();

    Random random = new Random();

    boolean gameOver = false;

    public SurvivalGame() {

        JFrame frame = new JFrame("Campus Survival Game");

        frame.setSize(800, 600);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.add(this);
        frame.setVisible(true);

        frame.addKeyListener(this);

        // Create enemies
        for (int i = 0; i < 5; i++) {
            spawnEnemy();
        }

        timer = new Timer(50, this);
        timer.start();
    }

    // Spawn enemy
    public void spawnEnemy() {

        int x = random.nextInt(750);
        int y = random.nextInt(550);

        enemies.add(new Rectangle(x, y, 30, 30));
    }

    // Paint Game
    public void paintComponent(Graphics g) {

        super.paintComponent(g);

        // Background
        setBackground(Color.BLACK);

        // Player
        g.setColor(Color.CYAN);
        g.fillOval(playerX, playerY, playerSize, playerSize);

        // Enemies
        g.setColor(Color.RED);

        for (Rectangle enemy : enemies) {
            g.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        }

        // Score
        g.setColor(Color.WHITE);
        g.setFont(new Font("Arial", Font.BOLD, 20));
        g.drawString("Score: " + score, 20, 30);

        // Game Over
        if (gameOver) {
            g.setFont(new Font("Arial", Font.BOLD, 40));
            g.drawString("GAME OVER", 260, 250);

            g.setFont(new Font("Arial", Font.BOLD, 20));
            g.drawString("Final Score: " + score, 320, 300);
        }
    }

    // Game Loop
    @Override
    public void actionPerformed(ActionEvent e) {

        if (!gameOver) {

            // Move enemies toward player
            for (Rectangle enemy : enemies) {

                if (enemy.x < playerX)
                    enemy.x += 4;

                if (enemy.x > playerX)
                    enemy.x -= 4;

                if (enemy.y < playerY)
                    enemy.y += 4;

                if (enemy.y > playerY)
                    enemy.y -= 4;

                // Collision Detection
                Rectangle player =
                        new Rectangle(playerX, playerY, playerSize, playerSize);

                if (enemy.intersects(player)) {
                    gameOver = true;
                    timer.stop();
                }
            }

            score++;
        }

        repaint();
    }

    // Key Controls
    @Override
    public void keyPressed(KeyEvent e) {

        int key = e.getKeyCode();

        if (key == KeyEvent.VK_UP) {
            playerY -= speed;
        }

        if (key == KeyEvent.VK_DOWN) {
            playerY += speed;
        }

        if (key == KeyEvent.VK_LEFT) {
            playerX -= speed;
        }

        if (key == KeyEvent.VK_RIGHT) {
            playerX += speed;
        }

        // Boundary Check
        if (playerX < 0)
            playerX = 0;

        if (playerY < 0)
            playerY = 0;

        if (playerX > 740)
            playerX = 740;

        if (playerY > 520)
            playerY = 520;
    }

    @Override
    public void keyReleased(KeyEvent e) {}

    @Override
    public void keyTyped(KeyEvent e) {}

    // Main Method
    public static void main(String[] args) {

        new SurvivalGame();
    }
}
