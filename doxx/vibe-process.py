import matplotlib.pyplot as plt

def main():
    fig, axs = plt.subplots(1, 2, figsize=(16, 10))
    fig.suptitle('True Vibe Coding Process', fontsize=16)

    # Jules's Workflow
    axs[0].set_title("Jules's Workflow (The True Vibe)")
    axs[0].set_xlim(0, 1)
    axs[0].set_ylim(0, 8)
    axs[0].axis('off')

    steps_jules = [
        "Merge PR",
        "Mark PR 'ready for review'",
        "purr GitHub Action",
        "Jules creates PR",
        "Jules completes task",
        "Jules starts task",
        "User creates issue with Jules tag",
    ]

    for i, step in enumerate(steps_jules):
        axs[0].text(0.5, i + 0.5, step, ha='center', va='center', bbox=dict(boxstyle="round,pad=0.5", fc="lightblue", ec="b", lw=1))
        if i > 0:
            axs[0].arrow(0.5, i, 0, -0.5, head_width=0.05, head_length=0.1, fc='k', ec='k')


    # User's Workflow
    axs[1].set_title("Manual Workflow (Incorrect)")
    axs[1].set_xlim(0, 1)
    axs[1].set_ylim(0, 8)
    axs[1].axis('off')

    steps_user = [
        "Jules gets an exception",
        "User is supposed to commit to main",
        "Close PR",
        "purr GitHub Action",
        "User opens PR",
        "User commits & pushes to branch",
    ]

    for i, step in enumerate(steps_user):
        axs[1].text(0.5, i + 0.5, step, ha='center', va='center', bbox=dict(boxstyle="round,pad=0.5", fc="lightcoral", ec="r", lw=1))
        if i > 0:
            axs[1].arrow(0.5, i, 0, -0.5, head_width=0.05, head_length=0.1, fc='k', ec='k')

    plt.tight_layout(rect=[0, 0, 1, 0.96])
    plt.savefig("doxx/vibe-process-python.png")

if __name__ == "__main__":
    main()
