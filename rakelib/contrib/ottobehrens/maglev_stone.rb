require File.join(File.dirname(__FILE__), 'stone')

# Set the GemStoneInstallation paths for a default install of MagLev, based
# on $MAGLEV_HOME.
ML = ENV['MAGLEV_HOME']
GemStoneInstallation.current = GemStoneInstallation.new(
  "#{ML}/gemstone", "#{ML}/etc/conf.d", "#{ML}/data",
  "#{ML}/log", "#{ML}/backups", 'extent0.ruby.dbf')

class MagLevStone < Stone
  def config_file_template
    File.open(File.dirname(__FILE__) + "/maglev_stone.conf.template").read
  end

  def key_file
    "#{ML}/etc/maglev.demo.key"
  end

  def create_skeleton
    mkdir_p backup_directory
    mkdir_p @gemstone_installation.config_directory
    super
  end

  # Will remove everything in the stone's data directory!
  def destroy!
    super
    rm_rf data_directory
  end

  # Will remove everything in the stone's data directory!
  def clobber_data!
    fail "Can not clobber data on a running stone" if running?
    rm_rf extent_directory
    rm_rf tranlog_directories
    mkdir_p extent_directory
    mkdir_p tranlog_directories
  end

  def replace
    stop if running?
    destroy!
    initialize_new_stone
  end

  def start
    start_parser unless parser_running?
    puts "MagLev server \"#{name}\" starting..."
    super
    ensure_prims_loaded
  end

  def take_snapshot
    if running?
      stop
      make_offline_backup
      start
    else
      make_offline_backup
    end
  end

  def restore_snapshot
    if running?
      stop
      restore_offline_backup
      start
    else
      restore_offline_backup
    end
  end

  def make_offline_backup
    fail "Must stop server before making offline backup." if running?
    puts "Making offline backup to: #{backup_directory}/#{snapshot_filename}"
    Dir.chdir(extent_directory)
    log_sh "tar zcf #{backup_directory}/#{snapshot_filename} *dbf"
  end

  def restore_offline_backup
    fail "Must stop server before restoring full backup." if running?
    clobber_data!
    puts "Restoring offline backup from: #{backup_directory}/#{snapshot_to_restore}"
    Dir.chdir(extent_directory)
    log_sh "tar zxfv #{backup_directory}/#{snapshot_to_restore}"
  end

  def snapshot_filename
    "#{name}_extent.tgz"
    # TODO allow multiple snapshot files by time of day
    # "#{name}_#{Time.now.strftime("%Y%d%H-%H%M")}.bak.tgz"
  end

  def snapshot_to_restore
    "#{name}_extent.tgz"
    # TODO allow selection of snapshot file to restore
  end

  def initialize_gemstone_environment
    super
    ENV['GEMSTONE_NAME'] = name
    # Tell gslist and others where the root of the install is.
    ENV['GEMSTONE_GLOBAL_DIR'] = ENV['MAGLEV_HOME']
  end

  # Expensive: throws away the current ruby context, and creates a new one
  # from scratch.  Side-effect is that all primitives are re-read.
  def reset_ruby_context
    if running?
      run_topaz_commands("RubyContext reset", "RubyContext load")
    end
  end

  # Loads the primitives if they haven't been loaded, then commits the
  # transaction.  Does nothing if prims are already loaded.
  def ensure_prims_loaded
    if running?
      puts "Loading kernel if needed. It may take a few seconds..."
      run_topaz_command("RubyContext ensurePrimsLoaded")
      puts "Kernel is loaded."
    end
  end
end
