import pygame
import random
import math

# 初始化 Pygame
pygame.init()

# 游戏设置
WIDTH, HEIGHT = 800, 600
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Merge Balls Game - Target: 2^20")

# 颜色定义
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

# 定义球的级别，从2^1到2^20
LEVELS = list(range(1, 21))  # 1 to 20, representing 2^1 to 2^20
COLORS = [(random.randint(50, 255), random.randint(50, 255), random.randint(50, 255)) for _ in LEVELS]

# 球类
class Ball:
    def __init__(self, x, y, level):
        self.x = x
        self.y = y
        self.level = level
        self.value = 2 ** level
        self.radius = 10 + level * 2  # 大小递增
        self.vx = 0
        self.vy = 0
        self.color = COLORS[level - 1]

    def draw(self):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.radius)
        font = pygame.font.SysFont(None, int(self.radius))
        text = font.render(str(self.value), True, WHITE)
        text_rect = text.get_rect(center=(int(self.x), int(self.y)))
        screen.blit(text, text_rect)

    def update(self, gravity=0.5):
        self.vy += gravity
        self.x += self.vx
        self.y += self.vy

        # 边界碰撞
        if self.x - self.radius < 0:
            self.x = self.radius
            self.vx = -self.vx * 0.8  # 弹性碰撞
        if self.x + self.radius > WIDTH:
            self.x = WIDTH - self.radius
            self.vx = -self.vx * 0.8
        if self.y + self.radius > HEIGHT:
            self.y = HEIGHT - self.radius
            self.vy = -self.vy * 0.8
            self.vx *= 0.9  # 摩擦

# 检查两个球是否碰撞
def check_collision(ball1, ball2):
    dx = ball1.x - ball2.x
    dy = ball1.y - ball2.y
    dist = math.sqrt(dx**2 + dy**2)
    return dist <= ball1.radius + ball2.radius

# 合并球
def merge_balls(ball1, ball2):
    new_level = ball1.level + 1
    if new_level > 20:
        new_level = 20  # 防止超过
    new_x = (ball1.x + ball2.x) / 2
    new_y = (ball1.y + ball2.y) / 2
    new_ball = Ball(new_x, new_y, new_level)
    new_ball.vx = (ball1.vx + ball2.vx) / 2
    new_ball.vy = (ball1.vy + ball2.vy) / 2
    return new_ball

# 主游戏循环
def main():
    clock = pygame.time.Clock()
    balls = []
    current_min_level = 1
    current_max_level = 1  # 从最小开始，逐步解锁更高等级

    running = True
    dropping = False
    drop_ball = None
    mouse_x = 0

    while running:
        screen.fill(BLACK)

        # 事件处理
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            if event.type == pygame.MOUSEBUTTONDOWN and not dropping:
                dropping = True
                # 随机选择球级别
                # "从当前最小球数值到最大球数值的2^(k-2）之间" - 假设k是当前max_level，随机从min到 max的2^(k-2) 但可能有误，简化成随机从min到当前max
                # 假设随机从1到当前max_level + 某个范围，这里简化：随机从当前min到max_level中的一个
                max_selectable = max(1, current_max_level - 1)  # 2^(k-2) 简化
                selected_level = random.randint(current_min_level, max_selectable)
                drop_ball = Ball(event.pos[0], 50, selected_level)  # 从顶部掉落
            if event.type == pygame.MOUSEMOTION:
                mouse_x = event.pos[0]

        # 如果在掉落模式，更新掉落位置
        if dropping and drop_ball:
            drop_ball.x = mouse_x
            if pygame.mouse.get_pressed()[0] == 0:  # 释放鼠标开始掉落
                dropping = False
                balls.append(drop_ball)
                drop_ball = None

        # 更新所有球
        for ball in balls:
            ball.update()

        # 碰撞检测和合并
        i = 0
        while i < len(balls):
            j = i + 1
            while j < len(balls):
                if check_collision(balls[i], balls[j]):
                    if balls[i].level == balls[j].level:
                        # 合并
                        new_ball = merge_balls(balls[i], balls[j])
                        balls.append(new_ball)
                        # 更新当前max_level
                        if new_ball.level > current_max_level:
                            current_max_level = new_ball.level
                        # 移除旧球
                        del balls[j]
                        del balls[i]
                        break
                    else:
                        # 简单弹性碰撞
                        dx = balls[i].x - balls[j].x
                        dy = balls[i].y - balls[j].y
                        dist = math.sqrt(dx**2 + dy**2)
                        if dist > 0:
                            overlap = (balls[i].radius + balls[j].radius - dist) / 2
                            balls[i].x += (dx / dist) * overlap
                            balls[i].y += (dy / dist) * overlap
                            balls[j].x -= (dx / dist) * overlap
                            balls[j].y -= (dy / dist) * overlap

                            # 交换速度
                            v1 = math.sqrt(balls[i].vx**2 + balls[i].vy**2)
                            v2 = math.sqrt(balls[j].vx**2 + balls[j].vy**2)
                            balls[i].vx, balls[j].vx = balls[j].vx, balls[i].vx
                            balls[i].vy, balls[j].vy = balls[j].vy, balls[i].vy

                j += 1
            i += 1

        # 绘制所有球
        for ball in balls:
            ball.draw()

        # 检查是否达到2^20
        if any(ball.level == 20 for ball in balls):
            font = pygame.font.SysFont(None, 50)
            text = font.render("You Win! 2^20 Achieved!", True, WHITE)
            screen.blit(text, (WIDTH // 2 - 200, HEIGHT // 2))

        # 如果dropping，绘制预览球
        if dropping and drop_ball:
            drop_ball.draw()

        pygame.display.flip()
        clock.tick(60)

    pygame.quit()

if __name__ == "__main__":
    main()